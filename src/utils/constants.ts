// Radar display settings
export const RADAR_RADIUS = 290;        // pixels
export const RADAR_CENTER = 300;        // center of 600x600 canvas
export const RADAR_RANGE_NM = 30;       // nautical miles

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

// Runway (centered, runway 27 - heading 270)
export const RUNWAY = {
  id: 'RWY27',
  position: { x: RADAR_CENTER, y: RADAR_CENTER },
  heading: 270,
  length: 40,
};

// Approach settings
export const APPROACH_FIX_DISTANCE = 10;  // nm from runway to start approach
export const LANDING_DISTANCE = 0.5;      // nm - considered landed

// Pixels per nautical mile
export const PIXELS_PER_NM = RADAR_RADIUS / RADAR_RANGE_NM;
