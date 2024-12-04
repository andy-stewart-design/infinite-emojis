import CanvasAnimation from "./render";
import type {
  OffscreenCanvasInit,
  OffscreenCanvasMessageEvent,
} from "./send-to-worker";
import type { Vec2 } from "./types";

class OffscreenCanvasRenderer {
  private canvas: OffscreenCanvas | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | null = null;
  private animation: CanvasAnimation | null = null;
  private rafId = 0;
  private dpr = 1;

  public init({ canvas, dpr }: OffscreenCanvasInit) {
    this.canvas = canvas;
    this.dpr = dpr;

    const offscreenCTX = this.canvas.getContext("2d");
    if (!offscreenCTX) {
      throw new Error("Could not get 2d context in web worker");
    }

    this.ctx = offscreenCTX;
    this.ctx.scale(this.dpr, this.dpr);
    this.animation = new CanvasAnimation(
      this.ctx,
      this.canvas.width,
      this.canvas.height
    );

    this.render(0);
  }

  public onMouseMove(vec: Vec2) {
    this.animation?.onMove(vec.x, vec.y);
  }

  public onPress(isPressed: boolean, x?: number, y?: number) {
    this.animation?.onPress(isPressed, x, y);
  }

  public onClick(vec: Vec2) {
    this.animation?.onClick(vec.x, vec.y);
  }

  public onWheel(deltaX: number, deltaY: number) {
    this.animation?.onWheel(deltaX, deltaY);
  }

  public onImageLoaded(bitmap: ImageBitmap | HTMLImageElement) {
    this.animation?.onImageLoaded(bitmap);
  }

  public resize(width: number, height: number) {
    if (!this.canvas || !this.ctx) return;

    cancelAnimationFrame(this.rafId);
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.animation?.onResize(width, height);

    this.render(0);
  }

  public render(timestamp: number) {
    if (!this.animation) return;
    this.animation.render(timestamp);
    this.rafId = requestAnimationFrame((t) => this.render(t));
  }

  public destroy() {
    cancelAnimationFrame(this.rafId);
  }
}

const renderer = new OffscreenCanvasRenderer();
self.onmessage = handleOffscreenCanvasMessage;

function handleOffscreenCanvasMessage({ data }: OffscreenCanvasMessageEvent) {
  if (data.type === "init") {
    renderer.init(data);
  } else if (data.type === "mouseMove") {
    renderer.onMouseMove(data);
  } else if (data.type === "pressStart" || data.type === "pressEnd") {
    renderer.onPress(data.isPressed, data.x, data.y);
  } else if (data.type === "click") {
    renderer.onClick({ x: data.x, y: data.y });
  } else if (data.type === "wheel") {
    renderer.onWheel(data.deltaX, data.deltaY);
  } else if (data.type === "resize") {
    renderer.resize(data.width, data.height);
  } else if (data.type === "image") {
    renderer.onImageLoaded(data.image);
  }
}
