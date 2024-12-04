function getDpr() {
  return Math.min(window.devicePixelRatio || 1, 2);
}

export { getDpr };
