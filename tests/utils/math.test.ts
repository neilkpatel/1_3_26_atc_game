import { describe, it, expect } from 'vitest';
import {
  normalizeHeading,
  headingDifference,
  toRadians,
  toDegrees,
  distancePixels,
  movePosition,
} from '../../src/utils/math';

describe('normalizeHeading', () => {
  it('should keep valid headings unchanged', () => {
    expect(normalizeHeading(0)).toBe(0);
    expect(normalizeHeading(90)).toBe(90);
    expect(normalizeHeading(180)).toBe(180);
    expect(normalizeHeading(359)).toBe(359);
  });

  it('should normalize headings >= 360', () => {
    expect(normalizeHeading(360)).toBe(0);
    expect(normalizeHeading(450)).toBe(90);
    expect(normalizeHeading(720)).toBe(0);
  });

  it('should normalize negative headings', () => {
    expect(normalizeHeading(-90)).toBe(270);
    expect(normalizeHeading(-180)).toBe(180);
    expect(normalizeHeading(-360)).toBe(0);
  });
});

describe('headingDifference', () => {
  it('should calculate direct differences', () => {
    expect(headingDifference(0, 90)).toBe(90);
    expect(headingDifference(90, 0)).toBe(-90);
    expect(headingDifference(0, 180)).toBe(180);
  });

  it('should take the shortest turn', () => {
    expect(headingDifference(350, 10)).toBe(20);
    expect(headingDifference(10, 350)).toBe(-20);
    expect(headingDifference(0, 270)).toBe(-90);
    expect(headingDifference(270, 0)).toBe(90);
  });
});

describe('toRadians and toDegrees', () => {
  it('should convert correctly', () => {
    expect(toRadians(180)).toBeCloseTo(Math.PI);
    expect(toRadians(90)).toBeCloseTo(Math.PI / 2);
    expect(toDegrees(Math.PI)).toBeCloseTo(180);
    expect(toDegrees(Math.PI / 2)).toBeCloseTo(90);
  });
});

describe('distancePixels', () => {
  it('should calculate distance between points', () => {
    expect(distancePixels({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(distancePixels({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    expect(distancePixels({ x: 1, y: 1 }, { x: 4, y: 5 })).toBe(5);
  });
});

describe('movePosition', () => {
  it('should move north (heading 0)', () => {
    const result = movePosition({ x: 100, y: 100 }, 0, 10);
    expect(result.x).toBeCloseTo(100);
    expect(result.y).toBeCloseTo(90); // y decreases going north
  });

  it('should move east (heading 90)', () => {
    const result = movePosition({ x: 100, y: 100 }, 90, 10);
    expect(result.x).toBeCloseTo(110);
    expect(result.y).toBeCloseTo(100);
  });

  it('should move south (heading 180)', () => {
    const result = movePosition({ x: 100, y: 100 }, 180, 10);
    expect(result.x).toBeCloseTo(100);
    expect(result.y).toBeCloseTo(110); // y increases going south
  });

  it('should move west (heading 270)', () => {
    const result = movePosition({ x: 100, y: 100 }, 270, 10);
    expect(result.x).toBeCloseTo(90);
    expect(result.y).toBeCloseTo(100);
  });
});
