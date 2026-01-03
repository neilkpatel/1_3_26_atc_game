export interface Position {
  x: number;
  y: number;
}

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
  clearedApproach: boolean;
  landed: boolean;
  departed: boolean;
}

export interface Runway {
  id: string;
  position: Position;     // threshold position
  heading: number;        // runway heading
  length: number;         // in pixels for display
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
  type: 'heading' | 'altitude' | 'speed' | 'approach';
  value?: number;
}
