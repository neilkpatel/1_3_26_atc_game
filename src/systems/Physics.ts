import { AircraftState } from '../types';
import {
  TURN_RATE,
  CLIMB_RATE,
  DESCENT_RATE,
  ACCEL_RATE,
  DECEL_RATE,
  PIXELS_PER_NM,
  RADAR_RADIUS,
  RADAR_CENTER,
} from '../utils/constants';
import { headingDifference, normalizeHeading, movePosition, isWithinRadar } from '../utils/math';

/**
 * Update aircraft physics for one frame
 * @param aircraft The aircraft to update
 * @param deltaTime Time since last frame in seconds
 */
export function updateAircraft(aircraft: AircraftState, deltaTime: number): void {
  // Skip if landed or departed
  if (aircraft.landed || aircraft.departed) return;

  // Update heading (turn toward target)
  const headingDiff = headingDifference(aircraft.heading, aircraft.targetHeading);
  if (Math.abs(headingDiff) > 0.5) {
    const turnAmount = TURN_RATE * deltaTime;
    if (Math.abs(headingDiff) <= turnAmount) {
      aircraft.heading = aircraft.targetHeading;
    } else {
      aircraft.heading = normalizeHeading(
        aircraft.heading + (headingDiff > 0 ? turnAmount : -turnAmount)
      );
    }
  }

  // Update altitude (climb/descend toward target)
  const altDiff = aircraft.targetAltitude - aircraft.altitude;
  if (Math.abs(altDiff) > 0.5) {
    const rate = altDiff > 0 ? CLIMB_RATE : -DESCENT_RATE;
    const altChange = rate * deltaTime;
    if (Math.abs(altDiff) <= Math.abs(altChange)) {
      aircraft.altitude = aircraft.targetAltitude;
    } else {
      aircraft.altitude += altChange;
    }
  }

  // Update speed (accelerate/decelerate toward target)
  const spdDiff = aircraft.targetSpeed - aircraft.speed;
  if (Math.abs(spdDiff) > 0.5) {
    const rate = spdDiff > 0 ? ACCEL_RATE : -DECEL_RATE;
    const spdChange = rate * deltaTime;
    if (Math.abs(spdDiff) <= Math.abs(spdChange)) {
      aircraft.speed = aircraft.targetSpeed;
    } else {
      aircraft.speed += spdChange;
    }
  }

  // Update position based on speed and heading
  // Speed is in knots, we need pixels per second
  // 1 knot = 1 nm/hour = 1/3600 nm/second
  const nmPerSecond = aircraft.speed / 3600;
  const pixelsPerSecond = nmPerSecond * PIXELS_PER_NM;
  const distance = pixelsPerSecond * deltaTime;

  aircraft.position = movePosition(aircraft.position, aircraft.heading, distance);
}

/**
 * Check if aircraft has left the radar scope (for departures)
 */
export function hasLeftRadar(aircraft: AircraftState): boolean {
  return !isWithinRadar(aircraft.position, RADAR_RADIUS + 20);
}

/**
 * Check if aircraft is within landing parameters
 */
export function isOnApproach(aircraft: AircraftState, runwayHeading: number): boolean {
  if (!aircraft.isArrival || !aircraft.clearedApproach) return false;

  // Check heading is aligned (within 10 degrees)
  const headingDiff = Math.abs(headingDifference(aircraft.heading, runwayHeading));
  if (headingDiff > 10) return false;

  // Check altitude is low enough (below 3000 ft)
  if (aircraft.altitude > 30) return false;

  // Check speed is appropriate (below 160 kts)
  if (aircraft.speed > 160) return false;

  return true;
}

/**
 * Calculate distance to runway center in NM
 */
export function distanceToRunway(aircraft: AircraftState): number {
  const dx = aircraft.position.x - RADAR_CENTER;
  const dy = aircraft.position.y - RADAR_CENTER;
  const distPixels = Math.sqrt(dx * dx + dy * dy);
  return distPixels / PIXELS_PER_NM;
}
