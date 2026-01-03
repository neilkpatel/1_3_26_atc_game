import { AircraftState } from '../types';
import { distanceNM } from '../utils/math';
import { MIN_HORIZONTAL_SEP, MIN_VERTICAL_SEP } from '../utils/constants';

export interface ConflictPair {
  aircraft1: string;
  aircraft2: string;
  horizontalSep: number;
  verticalSep: number;
}

/**
 * Check for separation conflicts between all aircraft
 * Returns array of conflict pairs
 */
export function detectConflicts(aircraft: AircraftState[]): ConflictPair[] {
  const conflicts: ConflictPair[] = [];
  const active = aircraft.filter(a => !a.landed && !a.departed);

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a1 = active[i];
      const a2 = active[j];

      const horizontalSep = distanceNM(a1.position, a2.position);
      const verticalSep = Math.abs(a1.altitude - a2.altitude);

      // Conflict if BOTH separations are below minimums
      if (horizontalSep < MIN_HORIZONTAL_SEP && verticalSep < MIN_VERTICAL_SEP) {
        conflicts.push({
          aircraft1: a1.id,
          aircraft2: a2.id,
          horizontalSep,
          verticalSep,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Check if a specific aircraft is in any conflict
 */
export function isInConflict(aircraftId: string, conflicts: ConflictPair[]): boolean {
  return conflicts.some(c => c.aircraft1 === aircraftId || c.aircraft2 === aircraftId);
}

/**
 * Check for actual collision (very close proximity)
 */
export function detectCollisions(aircraft: AircraftState[]): boolean {
  const active = aircraft.filter(a => !a.landed && !a.departed);

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a1 = active[i];
      const a2 = active[j];

      const horizontalSep = distanceNM(a1.position, a2.position);
      const verticalSep = Math.abs(a1.altitude - a2.altitude);

      // Collision if extremely close
      if (horizontalSep < 0.5 && verticalSep < 5) {
        return true;
      }
    }
  }

  return false;
}
