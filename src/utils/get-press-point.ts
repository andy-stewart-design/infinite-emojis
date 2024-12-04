function getPressPoint(event: TouchEvent | MouseEvent) {
  let currentX: number, currentY: number;

  if ("touches" in event) {
    const touch = event.touches[0];
    currentX = touch.clientX;
    currentY = touch.clientY;
  } else {
    currentX = event.clientX;
    currentY = event.clientY;
  }

  return { x: currentX, y: currentY };
}

export { getPressPoint };
