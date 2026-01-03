import { AircraftState, Runway, Position } from '../types';
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
  APPROACH_ALTITUDE,
  APPROACH_SPEED,
  TAKEOFF_SPEED,
  TAXI_SPEED,
  APPROACH_FIX_DISTANCE,
  getRunwayByLabel,
  getRunwayHeading,
  getWaypointById,
} from '../utils/constants';
import { headingDifference, normalizeHeading, movePosition, distancePixels, bearingTo, distanceNM } from '../utils/math';

/**
 * Update aircraft physics for one frame
 * @param aircraft The aircraft to update
 * @param deltaTime Time since last frame in seconds
 */
export function updateAircraft(aircraft: AircraftState, deltaTime: number): void {
  // Skip if landed or departed
  if (aircraft.status === 'landed' || aircraft.status === 'departed') return;

  // Handle different statuses with auto-pilot
  switch (aircraft.status) {
    case 'holding':
      // Stationary, waiting for takeoff clearance
      return;

    case 'taxiing':
      updateTaxiing(aircraft, deltaTime);
      break;

    case 'takeoff':
      updateTakeoff(aircraft, deltaTime);
      break;

    case 'approach':
      updateApproach(aircraft, deltaTime);
      break;

    case 'flying':
    default:
      updateFlying(aircraft, deltaTime);
      break;
  }
}

/**
 * Update a flying aircraft (normal controller-directed flight)
 */
function updateFlying(aircraft: AircraftState, deltaTime: number): void {
  // If assigned to a waypoint, auto-navigate toward it
  if (aircraft.assignedWaypoint) {
    const waypoint = getWaypointById(aircraft.assignedWaypoint);
    if (waypoint) {
      const bearingToWP = bearingTo(aircraft.position, waypoint.position);
      aircraft.targetHeading = bearingToWP;

      // Check if we've reached the waypoint
      const distToWP = distanceNM(aircraft.position, waypoint.position);
      if (distToWP < 1) {
        // Reached waypoint, clear assignment
        aircraft.assignedWaypoint = null;
      }
    }
  }

  // Standard flight physics
  updateHeading(aircraft, deltaTime);
  updateAltitude(aircraft, deltaTime);
  updateSpeed(aircraft, deltaTime);
  updatePosition(aircraft, deltaTime);
}

/**
 * Update an aircraft on approach
 */
function updateApproach(aircraft: AircraftState, deltaTime: number): void {
  if (!aircraft.assignedRunway) return;

  const runway = getRunwayByLabel(aircraft.assignedRunway);
  if (!runway) return;

  // Get the correct runway heading for this label
  const runwayHeading = getRunwayHeading(aircraft.assignedRunway);

  // Calculate approach fix position (point to intercept final approach)
  const approachFixRad = (runwayHeading + 180 - 90) * Math.PI / 180;
  const approachFix: Position = {
    x: runway.position.x + (APPROACH_FIX_DISTANCE * PIXELS_PER_NM) * Math.cos(approachFixRad + Math.PI),
    y: runway.position.y + (APPROACH_FIX_DISTANCE * PIXELS_PER_NM) * Math.sin(approachFixRad + Math.PI),
  };

  // Calculate distance to runway
  const distToRunway = distanceNM(aircraft.position, runway.position);

  // Calculate bearing to runway
  const bearingToRunway = bearingTo(aircraft.position, runway.position);

  // Check if we're on the final approach course
  const onFinal = Math.abs(headingDifference(bearingToRunway, runwayHeading)) < 30 && distToRunway < APPROACH_FIX_DISTANCE;

  if (onFinal) {
    // On final - fly direct to runway
    aircraft.targetHeading = bearingTo(aircraft.position, runway.position);

    // Descend proportionally to distance
    const targetAlt = Math.max(0, distToRunway * 3); // 3 degrees glide slope approximation
    aircraft.targetAltitude = Math.min(APPROACH_ALTITUDE, targetAlt);

    // Slow to approach speed
    aircraft.targetSpeed = APPROACH_SPEED;

    // Check for landing
    if (distToRunway < LANDING_DISTANCE && aircraft.altitude < 5) {
      aircraft.status = 'landed';
      aircraft.speed = 0;
      aircraft.targetSpeed = 0;
    }
  } else {
    // Not on final - navigate to intercept
    const distToFix = distanceNM(aircraft.position, approachFix);

    if (distToFix > 2) {
      // Fly to approach fix
      aircraft.targetHeading = bearingTo(aircraft.position, approachFix);
    } else {
      // Turn onto final
      aircraft.targetHeading = runwayHeading;
    }

    // Descend to approach altitude
    aircraft.targetAltitude = APPROACH_ALTITUDE;

    // Start slowing down
    aircraft.targetSpeed = Math.min(aircraft.targetSpeed, APPROACH_SPEED + 20);
  }

  updateHeading(aircraft, deltaTime);
  updateAltitude(aircraft, deltaTime);
  updateSpeed(aircraft, deltaTime);
  updatePosition(aircraft, deltaTime);
}

/**
 * Update a taxiing aircraft
 */
function updateTaxiing(aircraft: AircraftState, deltaTime: number): void {
  if (!aircraft.assignedRunway) return;

  const runway = getRunwayByLabel(aircraft.assignedRunway);
  if (!runway) return;

  // Get the correct runway heading
  const runwayHeading = getRunwayHeading(aircraft.assignedRunway);

  // Calculate runway threshold position
  const thresholdRad = (runwayHeading + 180 - 90) * Math.PI / 180;
  const threshold: Position = {
    x: runway.position.x + (runway.length / 2) * Math.cos(thresholdRad + Math.PI),
    y: runway.position.y + (runway.length / 2) * Math.sin(thresholdRad + Math.PI),
  };

  // Calculate distance to threshold
  const distToThreshold = distancePixels(aircraft.position, threshold);

  if (distToThreshold < 15) {
    // Reached threshold, begin takeoff
    aircraft.status = 'takeoff';
    aircraft.position = { ...threshold };
    aircraft.heading = runwayHeading;
    aircraft.targetHeading = runwayHeading;
    aircraft.targetSpeed = TAKEOFF_SPEED;
    aircraft.targetAltitude = 80; // Climb to 8000 ft
  } else {
    // Taxi toward threshold
    aircraft.targetHeading = bearingTo(aircraft.position, threshold);
    aircraft.targetSpeed = TAXI_SPEED;

    updateHeading(aircraft, deltaTime);
    updateSpeed(aircraft, deltaTime);
    updatePosition(aircraft, deltaTime);
  }
}

/**
 * Update a departing aircraft (taking off)
 */
function updateTakeoff(aircraft: AircraftState, deltaTime: number): void {
  // Accelerate on runway
  if (aircraft.speed < TAKEOFF_SPEED) {
    aircraft.targetSpeed = TAKEOFF_SPEED + 50;
  }

  // Once at takeoff speed, start climbing
  if (aircraft.speed >= TAKEOFF_SPEED - 10 && aircraft.altitude < 5) {
    aircraft.altitude = 10; // Rotate and lift off
  }

  // Once airborne, transition to flying
  if (aircraft.altitude >= 10 && aircraft.speed >= TAKEOFF_SPEED) {
    aircraft.status = 'flying';
    aircraft.targetAltitude = 80; // Climb to 8000 ft
    aircraft.targetSpeed = 220;
  }

  updateHeading(aircraft, deltaTime);
  updateAltitude(aircraft, deltaTime);
  updateSpeed(aircraft, deltaTime);
  updatePosition(aircraft, deltaTime);
}

/**
 * Update heading (turn toward target)
 */
function updateHeading(aircraft: AircraftState, deltaTime: number): void {
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
}

/**
 * Update altitude (climb/descend toward target)
 */
function updateAltitude(aircraft: AircraftState, deltaTime: number): void {
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
}

/**
 * Update speed (accelerate/decelerate toward target)
 */
function updateSpeed(aircraft: AircraftState, deltaTime: number): void {
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
}

/**
 * Update position based on speed and heading
 */
function updatePosition(aircraft: AircraftState, deltaTime: number): void {
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
 * Check if aircraft can land on assigned runway
 * Returns the runway if landing is possible, null otherwise
 */
export function checkLanding(aircraft: AircraftState): Runway | null {
  if (!aircraft.isArrival || aircraft.status !== 'approach' || !aircraft.assignedRunway) return null;

  const runway = getRunwayByLabel(aircraft.assignedRunway);
  if (!runway) return null;

  // Check altitude is low enough (below 500 ft)
  if (aircraft.altitude > 5) return null;

  // Check speed is appropriate (below 170 kts)
  if (aircraft.speed > 170) return null;

  // Check distance to runway
  const dist = distancePixels(aircraft.position, runway.position) / PIXELS_PER_NM;
  if (dist > LANDING_DISTANCE) return null;

  // Check alignment
  if (!isAlignedWithRunway(aircraft, runway)) return null;

  // Aircraft can land
  return runway;
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
