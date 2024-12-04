let canvas, ctx, imageBitmap;

self.onmessage = (e) => {
  if (e.data.canvas) {
    canvas = e.data.canvas;
    ctx = canvas.getContext("2d");
    canvas.width = canvas.width;
    canvas.height = canvas.height;
    draw();
  } else if (e.data.type === "image") {
    imageBitmap = e.data.image;
  }
};

function draw() {
  if (ctx && imageBitmap) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageBitmap, 50, 50); // Draw image at specified position
  }
  requestAnimationFrame(draw);
}
