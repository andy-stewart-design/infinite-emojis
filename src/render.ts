import { emojis } from "./emojis";
import type { Box, Vec2, Vec3 } from "./types";

type CanvasAnimationContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

class CanvasAnimation {
  private ctx: CanvasAnimationContext;
  private camera: Vec3 = { x: 0, y: 0, z: 1 };
  private canvas: Box;
  private viewport: Box;
  private grid = { rows: 10, cols: 10 };
  private cell = { width: 0, height: 0 };
  private mouse: { previous: Vec2; current: Vec2 } | null = null;
  private emojis: Array<string>;

  private pressStartPoint: Vec2 = { x: 0, y: 0 };
  private velocity: Vec2 = { x: 0, y: 0 };
  private activeCell = { index: 0, col: 0, row: 0 };
  private hoveredCell = { index: 0, col: 0, row: 0 };

  private framerate = 0;
  private prevTime = 0;

  private isOffscreen: boolean;
  private isPressed = false;

  private debugConfig = {
    show: true,
    offset: 12,
    fontSize: 16,
  };

  constructor(ctx: CanvasAnimationContext, width: number, height: number) {
    this.ctx = ctx;
    this.isOffscreen = this.ctx instanceof OffscreenCanvasRenderingContext2D;
    this.resize(width, height);
    this.emojis = emojis.slice(0, this.grid.cols * this.grid.rows);
  }

  private drawDebugPanel(timestamp: number) {
    // render debug panel
    const { show, fontSize, offset } = this.debugConfig;
    if (show) {
      // update the current framerate of the animation
      const dTime = timestamp - this.prevTime;
      const prevDec = (this.prevTime / 1000).toString().split(".")[1] ?? 0;
      const currDec = (timestamp / 1000).toString().split(".")[1] ?? 0;
      this.prevTime = timestamp;

      if (currDec < prevDec) {
        const nextFramerate = Math.floor(1000 / dTime);
        this.framerate = nextFramerate > 0 ? nextFramerate : 0;
      }

      const vpText = `Viewport: ${this.viewport.minX.toFixed(
        1
      )}, ${this.viewport.minY.toFixed(1)}, ${this.viewport.maxX.toFixed(
        1
      )}, ${this.viewport.maxY.toFixed(1)}`;
      const { width: w } = this.ctx.measureText(vpText);

      this.ctx.save();
      this.ctx.font = `300 ${fontSize}px system-ui`;
      this.ctx.fillStyle = "rgb(0 0 0 / 0.6)";
      this.ctx.strokeStyle = "rgb(255 255 255 / 0.15)";
      this.ctx.beginPath();
      this.ctx.roundRect(offset, offset, w + offset + fontSize * 1.25, 240, 8);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.closePath();
      this.ctx.fillStyle = "#efefef";
      this.ctx.textBaseline = "middle";

      const posX = offset + fontSize;
      const posY = (n = 1) => offset * 1.625 + fontSize * n;
      this.ctx.fillText(`Offscreen: ${this.isOffscreen}`, posX, posY(1));
      this.ctx.fillText(`Framerate: ${this.framerate}`, posX, posY(2.5));
      this.ctx.fillText(
        `Camera: ${this.camera.x.toFixed(2)}, ${this.camera.y.toFixed(2)}`,
        posX,
        posY(4)
      );
      this.ctx.fillText(
        `Viewport: ${this.viewport.minX.toFixed(
          1
        )}, ${this.viewport.minY.toFixed(1)}, ${this.viewport.maxX.toFixed(
          1
        )}, ${this.viewport.maxY.toFixed(1)}`,
        posX,
        posY(5.5)
      );
      this.ctx.fillText(
        `Mouse: ${this.mouse?.current.x.toFixed(
          2
        )}, ${this.mouse?.current.y.toFixed(2)}`,
        posX,
        posY(7)
      );
      this.ctx.fillText(
        `Velocity: ${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(
          2
        )}`,
        posX,
        posY(8.5)
      );
      this.ctx.fillText(`Is pressed: ${this.isPressed}`, posX, posY(10));
      this.ctx.fillText(
        `Active Cell: ${this.activeCell.index}, ${this.activeCell.col}, ${this.activeCell.row}`,
        posX,
        posY(11.5)
      );
      this.ctx.fillText(
        `Hovered Cell: ${this.hoveredCell.index}, ${this.hoveredCell.col}, ${this.hoveredCell.row}`,
        posX,
        posY(13)
      );
      this.ctx.restore;
    }
  }

  private animateVelocity() {
    if (this.isPressed) return;
    if (this.velocity.x === 0 && this.velocity.y === 0) return;

    if (Math.abs(this.velocity.x) < 0.1 && Math.abs(this.velocity.y) < 0.1) {
      this.velocity = { x: 0, y: 0 };
    } else {
      this.panCamera(this.velocity.x, this.velocity.y);
      this.velocity = {
        x: this.velocity.x * 0.9,
        y: this.velocity.y * 0.9,
      };
    }
  }

  private screenToCanvas(point: Vec2) {
    return {
      x: point.x / this.camera.z - this.camera.x,
      y: point.y / this.camera.z - this.camera.y,
    };
  }

  private panCamera(dx: number, dy: number) {
    if (-this.camera.x < 0) this.camera.x = -this.canvas.width;
    else if (-this.camera.x > this.canvas.width) this.camera.x = 0;
    else this.camera.x = this.camera.x - dx / this.camera.z;

    if (-this.camera.y < 0) this.camera.y = -this.canvas.height;
    else if (-this.camera.y > this.canvas.height) this.camera.y = 0;
    else this.camera.y = this.camera.y - dy / this.camera.z;
    // this.camera = {
    //   x: this.camera.x - dx / this.camera.z,
    //   y: this.camera.y - dy / this.camera.z,
    //   z: this.camera.z,
    // };
    this.viewport = {
      minX: -this.camera.x,
      minY: -this.camera.y,
      maxX: -this.camera.x + this.viewport.width,
      maxY: -this.camera.y + this.viewport.height,
      width: this.viewport.width,
      height: this.viewport.height,
    };
  }

  private getCellIndexFromPoint(x: number, y: number) {
    const canvasPoint = this.screenToCanvas({ x, y });
    const col = Math.floor(canvasPoint.x / this.cell.width) % this.grid.cols;
    const row = Math.floor(canvasPoint.y / this.cell.height) % this.grid.rows;
    const nCol = col >= 0 ? col : this.grid.cols + col;
    const nRow = row >= 0 ? row : this.grid.rows + row;
    return {
      index: nCol + nRow * this.grid.cols,
      col: nCol,
      row: nRow,
    };
  }

  private resize(width: number, height: number) {
    this.viewport = {
      minX: -this.camera.x,
      minY: -this.camera.y,
      maxX: -this.camera.x + width,
      maxY: -this.camera.y + height,
      width: width,
      height: height,
    };
    const cellWidth = Math.max(
      this.viewport.width / 4,
      this.viewport.height / 4
    );
    this.cell = {
      width: cellWidth,
      height: (cellWidth / 4) * 5,
    };
    this.canvas = {
      minX: 0,
      minY: 0,
      maxX: this.cell.width * this.grid.cols,
      maxY: this.cell.height * this.grid.rows,
      width: this.cell.width * this.grid.cols,
      height: this.cell.height * this.grid.rows,
    };
  }

  public render(timestamp: number) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.animateVelocity();

    this.ctx.save();
    this.ctx.translate(this.camera.x, this.camera.y);

    for (let i = 0; i < this.emojis.length; i++) {
      const rowIndex = i % this.grid.cols;
      const colIndex = Math.floor(i / this.grid.cols);
      const { width, height } = this.cell;

      //  MARK: Virtualize rendering ---------------------------------------------
      const cellMinX = this.camera.x + rowIndex * width;
      const cellMinY = this.camera.y + colIndex * height;
      const shiftX =
        cellMinX + width < 0
          ? this.canvas.width
          : cellMinX > this.viewport.width + this.cell.width
          ? -this.canvas.width
          : 0;
      const shiftY =
        cellMinY + height < 0
          ? this.canvas.height
          : cellMinY > this.viewport.height + this.cell.height
          ? -this.canvas.height
          : 0;

      const isVisibleX =
        shiftX + cellMinX + width < this.viewport.width + this.cell.width;
      const isVisibleY =
        shiftY + cellMinY + height < this.viewport.height + this.cell.height;

      if (!isVisibleX || !isVisibleY) continue;

      //  MARK: Render visible cells ---------------------------------------------
      this.ctx.fillStyle = "#1a1a1a";
      this.ctx.strokeStyle = "#3a3a3a";
      this.ctx.beginPath();
      this.ctx.rect(
        rowIndex * width + shiftX,
        colIndex * height + shiftY,
        width,
        height
      );
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.closePath();

      this.ctx.font = `300 ${13}px system-ui`;
      this.ctx.textAlign = "center";
      this.ctx.fillStyle = "white";
      this.ctx.fillText(
        i.toString(),
        rowIndex * width + shiftX + this.viewport.width / 55,
        colIndex * height + shiftY + this.viewport.width / 50
      );

      this.ctx.font = `300 ${40}px system-ui`;
      this.ctx.textAlign = "center";
      this.ctx.fillStyle = "white";
      this.ctx.fillText(
        this.emojis[i],
        rowIndex * width + shiftX + this.cell.width / 2,
        colIndex * height + shiftY + this.cell.height / 2
      );
    }

    this.ctx.restore();

    this.drawDebugPanel(timestamp);
  }

  public onMove(x: number, y: number) {
    if (!this.mouse) {
      this.mouse = {
        previous: { x, y },
        current: { x, y },
      };
    } else {
      const { x: prevX, y: prevY } = this.mouse.current;
      this.mouse = {
        previous: { x: prevX, y: prevY },
        current: { x, y },
      };
    }

    if (this.isPressed) {
      this.velocity = {
        x: this.mouse.previous.x - this.mouse.current.x,
        y: this.mouse.previous.y - this.mouse.current.y,
      };
      this.panCamera(this.velocity.x, this.velocity.y);
    }

    this.hoveredCell = this.getCellIndexFromPoint(x, y);
  }

  public onPress(
    isPressed: boolean,
    x: number | undefined = undefined,
    y: number | undefined = undefined
  ) {
    this.isPressed = isPressed;

    if (isPressed) {
      this.velocity = { x: 0, y: 0 };
      if (x !== undefined && y !== undefined) {
        this.pressStartPoint = { x, y };
      }
    } else if (x !== undefined && y !== undefined) {
      if (Math.abs(this.pressStartPoint.x - x) < 10) {
        this.velocity = { x: 0, y: 0 };
      }
    }
  }

  public onClick(x: number, y: number) {
    if (Math.abs(this.pressStartPoint.x - x) > 10) return;
    this.activeCell = this.getCellIndexFromPoint(x, y);
  }

  public onWheel(deltaX: number, deltaY: number) {
    this.panCamera(-deltaX, -deltaY);
  }

  public onResize(width: number, height: number) {
    this.resize(width, height);
  }
}

export default CanvasAnimation;
