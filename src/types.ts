interface Vec2 {
  x: number;
  y: number;
}

interface Vec3 extends Vec2 {
  z: number;
}

interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export type { Vec2, Vec3, Box };
