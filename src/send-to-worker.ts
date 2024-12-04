import OffscreenCanvasWorker from "./worker?worker";

interface OffscreenCanvasInit {
  type: "init";
  canvas: OffscreenCanvas;
  dpr: number;
}

interface OffscreenCanvasMoveEvent {
  type: "mouseMove";
  x: number;
  y: number;
}

interface OffscreenCanvasPressEvent {
  type: "pressStart" | "pressEnd";
  isPressed: boolean;
  x?: number;
  y?: number;
}

interface OffscreenCanvasClickEvent {
  type: "click";
  x: number;
  y: number;
}

interface OffscreenCanvasWheelEvent {
  type: "wheel";
  deltaX: number;
  deltaY: number;
}

interface OffscreenCanvasResizeEvent {
  type: "resize";
  width: number;
  height: number;
}

interface OffscreenCanvasResizeEvent {
  type: "resize";
  width: number;
  height: number;
}

interface OffscreenCanvasImageEvent {
  type: "image";
  image: ImageBitmap | HTMLImageElement;
}

type OffscreenCanvasMessage =
  | OffscreenCanvasInit
  | OffscreenCanvasMoveEvent
  | OffscreenCanvasPressEvent
  | OffscreenCanvasClickEvent
  | OffscreenCanvasWheelEvent
  | OffscreenCanvasResizeEvent
  | OffscreenCanvasImageEvent;
type OffscreenCanvasMessageEvent = MessageEvent<OffscreenCanvasMessage>;

const worker = new OffscreenCanvasWorker();

function sendToWorker(msg: OffscreenCanvasMessage) {
  if (msg.type === "init") {
    const { canvas, ...props } = msg;
    worker.postMessage({ ...props, canvas }, [canvas]);
  } else {
    worker.postMessage(msg);
  }
}

export {
  sendToWorker,
  type OffscreenCanvasInit,
  type OffscreenCanvasMessageEvent,
  type OffscreenCanvasMoveEvent,
  type OffscreenCanvasPressEvent,
  type OffscreenCanvasResizeEvent,
};
