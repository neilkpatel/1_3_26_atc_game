import { AircraftState } from '../types';
import { generateCallsign, randomEdgePosition, bearingTo, normalizeHeading } from '../utils/math';
import { CENTER_X, CENTER_Y, MIN_SPEED, MAX_SPEED, MIN_ALTITUDE, MAX_ALTITUDE, RUNWAYS, TAXIWAY_OFFSET } from '../utils/constants';

let nextId = 1;

export function createAircraft(isArrival: boolean): AircraftState {
  const id = `ac-${nextId++}`;
  const callsign = generateCallsign();

  if (isArrival) {
    // Arrivals spawn at edge, heading toward center
    const position = randomEdgePosition();
    const heading = bearingTo(position, { x: CENTER_X, y: CENTER_Y });
    const altitude = Math.floor(Math.random() * 50) + 80; // 8000-13000 ft
    const speed = Math.floor(Math.random() * 40) + 200;   // 200-240 kts

    return {
      id,
      callsign,
      position,
      heading: normalizeHeading(heading + (Math.random() - 0.5) * 30), // slight variation
      targetHeading: heading,
      altitude,
      targetAltitude: altitude,
      speed,
      targetSpeed: speed,
      isArrival: true,
      status: 'flying',
      assignedRunway: null,
      assignedWaypoint: null,
    };
  } else {
    // Departures spawn at taxiway near a random runway, waiting for clearance
    const runway = RUNWAYS[Math.floor(Math.random() * RUNWAYS.length)];
    const heading = runway.heading;

    // Position at taxiway (offset perpendicular to runway)
    const perpRad = (heading - 90) * Math.PI / 180;
    const taxiX = runway.position.x + TAXIWAY_OFFSET * Math.cos(perpRad);
    const taxiY = runway.position.y + TAXIWAY_OFFSET * Math.sin(perpRad);

    return {
      id,
      callsign,
      position: { x: taxiX, y: taxiY },
      heading,
      targetHeading: heading,
      altitude: 0,  // On ground
      targetAltitude: 0,
      speed: 0,     // Stationary
      targetSpeed: 0,
      isArrival: false,
      status: 'holding',  // Waiting for takeoff clearance
      assignedRunway: null,
      assignedWaypoint: null,
    };
  }
}

export function setHeading(aircraft: AircraftState, heading: number): void {
  // Only allow heading changes for flying aircraft
  if (aircraft.status === 'flying') {
    aircraft.targetHeading = normalizeHeading(heading);
  }
}

export function setAltitude(aircraft: AircraftState, altitude: number): void {
  // Only allow altitude changes for flying aircraft
  if (aircraft.status === 'flying') {
    aircraft.targetAltitude = Math.max(MIN_ALTITUDE, Math.min(MAX_ALTITUDE, altitude));
  }
}

export function setSpeed(aircraft: AircraftState, speed: number): void {
  // Only allow speed changes for flying aircraft
  if (aircraft.status === 'flying') {
    aircraft.targetSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
  }
}

/**
 * Clear an arrival for approach to a specific runway
 */
export function clearForApproach(aircraft: AircraftState, runwayLabel: string): void {
  if (aircraft.isArrival && aircraft.status === 'flying') {
    aircraft.assignedRunway = runwayLabel;
    aircraft.status = 'approach';
    // Auto-pilot will handle heading, descent, and speed reduction
  }
}

/**
 * Clear a departure for takeoff from a specific runway
 */
export function clearForTakeoff(aircraft: AircraftState, runwayLabel: string): void {
  if (!aircraft.isArrival && aircraft.status === 'holding') {
    aircraft.assignedRunway = runwayLabel;
    aircraft.status = 'taxiing';
    // Will transition to 'takeoff' when at runway threshold
  }
}

/**
 * Assign a waypoint for the aircraft to fly toward
 */
export function assignWaypoint(aircraft: AircraftState, waypointId: string): void {
  if (aircraft.status === 'flying') {
    aircraft.assignedWaypoint = waypointId;
  }
}

export function getDataTag(aircraft: AircraftState): string {
  const alt = String(Math.round(aircraft.altitude)).padStart(3, '0');
  const spd = String(Math.round(aircraft.speed / 10));

  // Show status indicator
  let statusIndicator = '';
  if (aircraft.status === 'holding') {
    statusIndicator = ' RDY';
  } else if (aircraft.status === 'approach') {
    statusIndicator = ` ILS${aircraft.assignedRunway}`;
  } else if (aircraft.status === 'taxiing') {
    statusIndicator = ' TAXI';
  } else if (aircraft.status === 'takeoff') {
    statusIndicator = ' T/O';
  }

  return `${aircraft.callsign}${statusIndicator}\n${alt} ${spd}`;
}
