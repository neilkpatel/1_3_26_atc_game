export interface Position {
  x: number;
  y: number;
}

export type AircraftStatus =
  | 'flying'      // In the air, normal operations
  | 'holding'     // Departure waiting for takeoff clearance
  | 'taxiing'     // Moving to runway
  | 'takeoff'     // Taking off
  | 'approach'    // On final approach
  | 'landed'      // Successfully landed
  | 'departed';   // Left the airspace

export interface AircraftState {
  id: string;
  callsign: string;
  position: Position;
  heading: number;        // 0-359 degrees
  targetHeading: number;
  altitude: number;       // in hundreds of feet (e.g., 50 = 5000ft)
  targetAltitude: number;
  speed: number;          // knots
  targetSpeed: number;
  isArrival: boolean;     // true = arriving, false = departing
  status: AircraftStatus;
  assignedRunway: string | null;    // e.g., "27R", "09L"
  assignedWaypoint: string | null;  // e.g., "ALPHA", "BRAVO"
}

export interface Runway {
  id: string;             // Full ID like "09L/27R"
  position: Position;     // center position
  heading: number;        // primary heading
  length: number;         // in pixels for display
  labelPrimary: string;   // e.g., "09L"
  labelSecondary: string; // e.g., "27R"
}

export interface Waypoint {
  id: string;           // e.g., "ALPHA"
  position: Position;
  label: string;        // Display label
}

export interface GameState {
  aircraft: AircraftState[];
  selectedAircraftId: string | null;
  score: number;
  landedCount: number;
  conflicts: string[];    // pairs of aircraft IDs in conflict
  gameOver: boolean;
}

export interface Command {
  type: 'heading' | 'altitude' | 'speed' | 'runway' | 'waypoint' | 'takeoff';
  value?: number;
  runwayId?: string;
  waypointId?: string;
}

export interface UFOState {
  id: string;
  position: Position;
  velocity: Position; // pixels per second (dx, dy)
  spawnTime: number;
}
