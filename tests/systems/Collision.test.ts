import { describe, it, expect } from 'vitest';
import { detectConflicts, isInConflict } from '../../src/systems/Collision';
import { AircraftState } from '../../src/types';
import { PIXELS_PER_NM } from '../../src/utils/constants';

function createTestAircraft(
  id: string,
  x: number,
  y: number,
  altitude: number
): AircraftState {
  return {
    id,
    callsign: `TEST${id}`,
    position: { x, y },
    heading: 0,
    targetHeading: 0,
    altitude,
    targetAltitude: altitude,
    speed: 200,
    targetSpeed: 200,
    isArrival: true,
    clearedApproach: false,
    landed: false,
    departed: false,
  };
}

describe('detectConflicts', () => {
  it('should detect no conflicts when aircraft are well separated', () => {
    const ac1 = createTestAircraft('1', 100, 100, 50);
    const ac2 = createTestAircraft('2', 100 + 5 * PIXELS_PER_NM, 100, 50); // 5nm apart

    const conflicts = detectConflicts([ac1, ac2]);
    expect(conflicts).toHaveLength(0);
  });

  it('should detect no conflicts with sufficient vertical separation', () => {
    const ac1 = createTestAircraft('1', 100, 100, 50);
    const ac2 = createTestAircraft('2', 100 + 1 * PIXELS_PER_NM, 100, 65); // 1nm apart, 1500ft vertical

    const conflicts = detectConflicts([ac1, ac2]);
    expect(conflicts).toHaveLength(0);
  });

  it('should detect conflict when too close horizontally and vertically', () => {
    const ac1 = createTestAircraft('1', 100, 100, 50);
    const ac2 = createTestAircraft('2', 100 + 1 * PIXELS_PER_NM, 100, 55); // 1nm apart, 500ft vertical

    const conflicts = detectConflicts([ac1, ac2]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].aircraft1).toBe('1');
    expect(conflicts[0].aircraft2).toBe('2');
  });

  it('should ignore landed aircraft', () => {
    const ac1 = createTestAircraft('1', 100, 100, 50);
    ac1.landed = true;
    const ac2 = createTestAircraft('2', 105, 100, 50);

    const conflicts = detectConflicts([ac1, ac2]);
    expect(conflicts).toHaveLength(0);
  });
});

describe('isInConflict', () => {
  it('should return true for aircraft in conflict', () => {
    const conflicts = [{ aircraft1: '1', aircraft2: '2', horizontalSep: 1, verticalSep: 5 }];
    expect(isInConflict('1', conflicts)).toBe(true);
    expect(isInConflict('2', conflicts)).toBe(true);
    expect(isInConflict('3', conflicts)).toBe(false);
  });
});
