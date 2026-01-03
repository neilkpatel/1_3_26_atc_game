import { Runway, Waypoint } from '../types';

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
export const TAXI_SPEED = 20;           // knots for taxiing

// Speed limits
export const MIN_SPEED = 120;           // knots
export const MAX_SPEED = 280;           // knots
export const APPROACH_SPEED = 140;      // knots for landing
export const TAKEOFF_SPEED = 150;       // knots at rotation

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

// 4 Runways - realistic intersecting layout with L/R designators
export const RUNWAYS: Runway[] = [
  {
    id: '09L/27R',
    position: { x: CENTER_X, y: CENTER_Y - 40 },  // North parallel
    heading: 90,
    length: 120,
    labelPrimary: '09L',
    labelSecondary: '27R',
  },
  {
    id: '09R/27L',
    position: { x: CENTER_X, y: CENTER_Y + 40 },  // South parallel
    heading: 90,
    length: 120,
    labelPrimary: '09R',
    labelSecondary: '27L',
  },
  {
    id: '04/22',
    position: { x: CENTER_X - 30, y: CENTER_Y },  // Diagonal NE-SW
    heading: 40,
    length: 100,
    labelPrimary: '04',
    labelSecondary: '22',
  },
  {
    id: '18/36',
    position: { x: CENTER_X + 50, y: CENTER_Y },  // North-South
    heading: 180,
    length: 100,
    labelPrimary: '18',
    labelSecondary: '36',
  },
];

// Get all runway labels for dropdowns
export function getAllRunwayLabels(): string[] {
  const labels: string[] = [];
  RUNWAYS.forEach(rwy => {
    labels.push(rwy.labelPrimary);
    labels.push(rwy.labelSecondary);
  });
  return labels;
}

// Get runway by label (e.g., "27R")
export function getRunwayByLabel(label: string): Runway | undefined {
  return RUNWAYS.find(rwy =>
    rwy.labelPrimary === label || rwy.labelSecondary === label
  );
}

// Get heading for a runway label
export function getRunwayHeading(label: string): number {
  const runway = getRunwayByLabel(label);
  if (!runway) return 0;
  // If it's the secondary label, return opposite heading
  if (runway.labelSecondary === label) {
    return (runway.heading + 180) % 360 || 360;
  }
  return runway.heading;
}

// 6 Waypoints around the map edges
export const WAYPOINTS: Waypoint[] = [
  {
    id: 'ALPHA',
    position: { x: 80, y: 150 },
    label: 'ALPHA',
  },
  {
    id: 'BRAVO',
    position: { x: CENTER_X, y: 40 },
    label: 'BRAVO',
  },
  {
    id: 'CHARLIE',
    position: { x: CANVAS_WIDTH - 80, y: 150 },
    label: 'CHARLIE',
  },
  {
    id: 'DELTA',
    position: { x: CANVAS_WIDTH - 80, y: CANVAS_HEIGHT - 150 },
    label: 'DELTA',
  },
  {
    id: 'ECHO',
    position: { x: CENTER_X, y: CANVAS_HEIGHT - 40 },
    label: 'ECHO',
  },
  {
    id: 'FOXTROT',
    position: { x: 80, y: CANVAS_HEIGHT - 150 },
    label: 'FOXTROT',
  },
];

// Get waypoint by ID
export function getWaypointById(id: string): Waypoint | undefined {
  return WAYPOINTS.find(wp => wp.id === id);
}

// Approach settings
export const APPROACH_FIX_DISTANCE = 10;  // nm from runway to start approach
export const LANDING_DISTANCE = 0.5;      // nm - considered landed

// Taxiway offset from runway (for holding departures)
export const TAXIWAY_OFFSET = 25;  // pixels
