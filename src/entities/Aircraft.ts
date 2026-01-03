import { AircraftState } from '../types';
import { generateCallsign, randomEdgePosition, bearingTo, normalizeHeading } from '../utils/math';
import { RADAR_RADIUS, RADAR_CENTER, MIN_SPEED, MAX_SPEED, MIN_ALTITUDE, MAX_ALTITUDE } from '../utils/constants';

let nextId = 1;

export function createAircraft(isArrival: boolean): AircraftState {
  const id = `ac-${nextId++}`;
  const callsign = generateCallsign();

  if (isArrival) {
    // Arrivals spawn at edge, heading toward center
    const position = randomEdgePosition(RADAR_RADIUS);
    const heading = bearingTo(position, { x: RADAR_CENTER, y: RADAR_CENTER });
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
      clearedApproach: false,
      landed: false,
      departed: false,
    };
  } else {
    // Departures start at runway
    const heading = 270; // Runway 27 heading
    return {
      id,
      callsign,
      position: { x: RADAR_CENTER, y: RADAR_CENTER },
      heading,
      targetHeading: heading,
      altitude: 10, // 1000 ft (just took off)
      targetAltitude: 80, // climb to 8000
      speed: 150,
      targetSpeed: 220,
      isArrival: false,
      clearedApproach: false,
      landed: false,
      departed: false,
    };
  }
}

export function setHeading(aircraft: AircraftState, heading: number): void {
  aircraft.targetHeading = normalizeHeading(heading);
}

export function setAltitude(aircraft: AircraftState, altitude: number): void {
  aircraft.targetAltitude = Math.max(MIN_ALTITUDE, Math.min(MAX_ALTITUDE, altitude));
}

export function setSpeed(aircraft: AircraftState, speed: number): void {
  aircraft.targetSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
}

export function clearForApproach(aircraft: AircraftState): void {
  if (aircraft.isArrival) {
    aircraft.clearedApproach = true;
  }
}

export function getDataTag(aircraft: AircraftState): string {
  const alt = String(aircraft.altitude).padStart(3, '0');
  const spd = String(Math.round(aircraft.speed / 10));
  return `${aircraft.callsign}\n${alt} ${spd}`;
}
