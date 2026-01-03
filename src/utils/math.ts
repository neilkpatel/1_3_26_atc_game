import { Position } from '../types';
import { PIXELS_PER_NM, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Normalize heading to 0-359
 */
export function normalizeHeading(heading: number): number {
  let h = heading % 360;
  if (h < 0) h += 360;
  return h === 0 ? 0 : h; // Convert -0 to 0
}

/**
 * Calculate distance between two positions in pixels
 */
export function distancePixels(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate distance between two positions in nautical miles
 */
export function distanceNM(p1: Position, p2: Position): number {
  return distancePixels(p1, p2) / PIXELS_PER_NM;
}

/**
 * Calculate the shortest turn direction to reach target heading
 * Returns positive for right turn, negative for left turn
 */
export function headingDifference(current: number, target: number): number {
  let diff = normalizeHeading(target) - normalizeHeading(current);
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

/**
 * Move position based on heading and distance
 * Heading: 0 = North, 90 = East, 180 = South, 270 = West
 */
export function movePosition(pos: Position, heading: number, distancePixels: number): Position {
  // Convert heading to math angle (0 = East, counterclockwise positive)
  // Aviation: 0 = North, clockwise positive
  const mathAngle = toRadians(90 - heading);
  return {
    x: pos.x + distancePixels * Math.cos(mathAngle),
    y: pos.y - distancePixels * Math.sin(mathAngle), // negative because canvas y is inverted
  };
}

/**
 * Calculate bearing from one position to another
 */
export function bearingTo(from: Position, to: Position): number {
  const dx = to.x - from.x;
  const dy = from.y - to.y; // inverted because canvas y is down
  const angle = toDegrees(Math.atan2(dx, dy));
  return normalizeHeading(angle);
}

/**
 * Generate a random position on the edge of the screen
 */
export function randomEdgePosition(): Position {
  const side = Math.floor(Math.random() * 4);
  const margin = 10;

  switch (side) {
    case 0: // Top
      return { x: Math.random() * CANVAS_WIDTH, y: margin };
    case 1: // Right
      return { x: CANVAS_WIDTH - margin, y: Math.random() * CANVAS_HEIGHT };
    case 2: // Bottom
      return { x: Math.random() * CANVAS_WIDTH, y: CANVAS_HEIGHT - margin };
    case 3: // Left
    default:
      return { x: margin, y: Math.random() * CANVAS_HEIGHT };
  }
}

/**
 * Generate random callsign
 */
export function generateCallsign(): string {
  const airlines = ['UAL', 'DAL', 'AAL', 'SWA', 'JBU', 'ASA', 'FFT', 'SKW'];
  const airline = airlines[Math.floor(Math.random() * airlines.length)];
  const number = Math.floor(Math.random() * 9000) + 100;
  return `${airline}${number}`;
}
