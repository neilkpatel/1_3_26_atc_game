import { Runway } from '../types';

// Display settings - full screen
export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 700;
export const CENTER_X = CANVAS_WIDTH / 2;
export const CENTER_Y = CANVAS_HEIGHT / 2;
export const RADAR_RANGE_NM = 30;       // nautical miles

// Pixels per nautical mile (based on smaller dimension)
export const PIXELS_PER_NM = (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) - 100) / 2 / RADAR_RANGE_NM;

// Aircraft performance
export const TURN_RATE = 3;             // degrees per second (standard rate)
export const CLIMB_RATE = 20;           // hundreds of feet per second (simplified)
export const DESCENT_RATE = 15;         // hundreds of feet per second
export const ACCEL_RATE = 2;            // knots per second
export const DECEL_RATE = 3;            // knots per second

// Speed limits
export const MIN_SPEED = 120;           // knots
export const MAX_SPEED = 280;           // knots
export const APPROACH_SPEED = 140;      // knots for landing

// Altitude limits
export const MIN_ALTITUDE = 10;         // 1000 feet
export const MAX_ALTITUDE = 150;        // 15000 feet
export const APPROACH_ALTITUDE = 30;    // 3000 feet to start approach

// Separation minimums
export const MIN_HORIZONTAL_SEP = 3;    // nautical miles
export const MIN_VERTICAL_SEP = 10;     // 1000 feet (in hundreds)

// Scoring
export const POINTS_PER_LANDING = 100;
export const POINTS_PER_DEPARTURE = 50;
export const CONFLICT_PENALTY = 25;

// Spawning
export const SPAWN_INTERVAL = 15000;    // milliseconds between spawns
export const MAX_AIRCRAFT = 8;

// 4 Runways - realistic intersecting layout
export const RUNWAYS: Runway[] = [
  {
    id: '09L/27R',
    position: { x: CENTER_X, y: CENTER_Y - 40 },  // North parallel
    heading: 90,  // Primary heading (09L), opposite is 270 (27R)
    length: 120,
  },
  {
    id: '09R/27L',
    position: { x: CENTER_X, y: CENTER_Y + 40 },  // South parallel
    heading: 90,  // Primary heading (09R), opposite is 270 (27L)
    length: 120,
  },
  {
    id: '04/22',
    position: { x: CENTER_X - 30, y: CENTER_Y },  // Diagonal NE-SW
    heading: 40,  // Primary heading (04), opposite is 220 (22)
    length: 100,
  },
  {
    id: '18/36',
    position: { x: CENTER_X + 50, y: CENTER_Y },  // North-South
    heading: 180, // Primary heading (18), opposite is 360/0 (36)
    length: 100,
  },
];

// Approach settings
export const APPROACH_FIX_DISTANCE = 10;  // nm from runway to start approach
export const LANDING_DISTANCE = 0.5;      // nm - considered landed
