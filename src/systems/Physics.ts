import { AircraftState, Runway } from '../types';
import {
  TURN_RATE,
  CLIMB_RATE,
  DESCENT_RATE,
  ACCEL_RATE,
  DECEL_RATE,
  PIXELS_PER_NM,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  RUNWAYS,
  LANDING_DISTANCE,
} from '../utils/constants';
import { headingDifference, normalizeHeading, movePosition, distancePixels } from '../utils/math';

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
 * Check if aircraft has left the screen
 */
export function hasLeftRadar(aircraft: AircraftState): boolean {
  const margin = 30;
  return (
    aircraft.position.x < -margin ||
    aircraft.position.x > CANVAS_WIDTH + margin ||
    aircraft.position.y < -margin ||
    aircraft.position.y > CANVAS_HEIGHT + margin
  );
}

/**
 * Check if aircraft is aligned with a specific runway (either direction)
 */
function isAlignedWithRunway(aircraft: AircraftState, runway: Runway): boolean {
  const primaryHeading = runway.heading;
  const oppositeHeading = normalizeHeading(runway.heading + 180);

  // Check alignment with either runway direction
  const headingDiff1 = Math.abs(headingDifference(aircraft.heading, primaryHeading));
  const headingDiff2 = Math.abs(headingDifference(aircraft.heading, oppositeHeading));

  return headingDiff1 <= 15 || headingDiff2 <= 15;
}

/**
 * Check if aircraft can land on any runway
 * Returns the runway if landing is possible, null otherwise
 */
export function checkLanding(aircraft: AircraftState): Runway | null {
  if (!aircraft.isArrival || !aircraft.clearedApproach) return null;

  // Check altitude is low enough (below 3000 ft)
  if (aircraft.altitude > 30) return null;

  // Check speed is appropriate (below 170 kts)
  if (aircraft.speed > 170) return null;

  // Check each runway
  for (const runway of RUNWAYS) {
    // Check distance to runway
    const dist = distancePixels(aircraft.position, runway.position) / PIXELS_PER_NM;
    if (dist > LANDING_DISTANCE) continue;

    // Check alignment
    if (!isAlignedWithRunway(aircraft, runway)) continue;

    // Aircraft can land on this runway
    return runway;
  }

  return null;
}

/**
 * Get the closest runway to an aircraft
 */
export function getClosestRunway(aircraft: AircraftState): Runway {
  let closest = RUNWAYS[0];
  let minDist = Infinity;

  for (const runway of RUNWAYS) {
    const dist = distancePixels(aircraft.position, runway.position);
    if (dist < minDist) {
      minDist = dist;
      closest = runway;
    }
  }

  return closest;
}
