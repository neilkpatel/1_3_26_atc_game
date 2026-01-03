import { AircraftState, GameState, Command } from '../types';
import { Radar } from './Radar';
import { InputHandler } from './InputHandler';
import { Spawner } from '../systems/Spawner';
import { Scoring } from '../systems/Scoring';
import { updateAircraft, hasLeftRadar, checkLanding } from '../systems/Physics';
import { detectConflicts, detectCollisions, ConflictPair } from '../systems/Collision';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';

export class Game {
  private radar: Radar;
  private inputHandler: InputHandler;
  private spawner: Spawner;
  private scoring: Scoring;

  private state: GameState = {
    aircraft: [],
    selectedAircraftId: null,
    score: 0,
    landedCount: 0,
    conflicts: [],
    gameOver: false,
  };

  private lastTime: number = 0;
  private conflicts: ConflictPair[] = [];
  private lastConflictCheck: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.radar = new Radar(canvas);
    this.spawner = new Spawner();
    this.scoring = new Scoring();

    this.inputHandler = new InputHandler(canvas);

    // Set up global click handler
    (window as unknown as { handleRadarClick: (x: number, y: number) => void }).handleRadarClick = (x: number, y: number) => {
      const ac = this.radar.getAircraftAtPosition(x, y, this.state.aircraft);
      this.selectAircraft(ac);
    };

    // Listen for commands
    window.addEventListener('atc-command', ((e: CustomEvent<Command>) => {
      this.handleCommand(e.detail);
    }) as EventListener);

    // Spawn initial aircraft - 2 arrivals, 1 departure
    this.state.aircraft.push(this.spawner.forceSpawn(true));
    this.state.aircraft.push(this.spawner.forceSpawn(true));
    this.state.aircraft.push(this.spawner.forceSpawn(false)); // Departure (holding)

    this.updateUI();
  }

  private selectAircraft(aircraft: AircraftState | null): void {
    this.state.selectedAircraftId = aircraft?.id ?? null;
    this.inputHandler.updateCommandPanel(aircraft);
    this.updateFlightStrips();
  }

  private handleCommand(command: Command): void {
    const selected = this.state.aircraft.find(a => a.id === this.state.selectedAircraftId);
    if (selected) {
      InputHandler.applyCommand(selected, command);
      this.inputHandler.updateCommandPanel(selected);
      this.updateFlightStrips();
    }
  }

  start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private gameLoop(currentTime: number): void {
    if (this.state.gameOver) {
      this.renderGameOver();
      return;
    }

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(deltaTime, currentTime);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private update(deltaTime: number, currentTime: number): void {
    // Update radar sweep
    this.radar.update(deltaTime);

    // Update aircraft physics
    this.state.aircraft.forEach(ac => {
      updateAircraft(ac, deltaTime);
    });

    // Check for landings
    this.state.aircraft.forEach(ac => {
      if (ac.isArrival && ac.status === 'approach') {
        const landingRunway = checkLanding(ac);
        if (landingRunway) {
          ac.status = 'landed';
          this.scoring.addLanding();
          this.updateUI();
        }
      }
    });

    // Check for departures leaving screen
    this.state.aircraft.forEach(ac => {
      if (!ac.isArrival && ac.status === 'flying' && hasLeftRadar(ac)) {
        ac.status = 'departed';
        this.scoring.addDeparture();
        this.updateUI();
      }
    });

    // Remove aircraft that are done or left improperly
    this.state.aircraft = this.state.aircraft.filter(ac => {
      // Keep landed and departed aircraft briefly, then remove
      if (ac.status === 'landed' || ac.status === 'departed') {
        return false; // Remove immediately
      }

      // Arrival left without landing - penalty
      if (ac.isArrival && ac.status !== 'approach' && hasLeftRadar(ac)) {
        this.scoring.addConflictPenalty();
        this.updateUI();
        return false;
      }

      return true;
    });

    // Check for conflicts every 500ms (only for flying aircraft)
    if (currentTime - this.lastConflictCheck > 500) {
      const flyingAircraft = this.state.aircraft.filter(a =>
        a.status === 'flying' || a.status === 'approach' || a.status === 'takeoff'
      );
      this.conflicts = detectConflicts(flyingAircraft);
      if (this.conflicts.length > 0) {
        this.scoring.addConflictPenalty();
        this.updateUI();
      }
      this.lastConflictCheck = currentTime;
    }

    // Check for collisions (game over)
    const flyingAircraft = this.state.aircraft.filter(a =>
      a.status === 'flying' || a.status === 'approach' || a.status === 'takeoff'
    );
    if (detectCollisions(flyingAircraft)) {
      this.state.gameOver = true;
    }

    // Spawn new aircraft
    const newAircraft = this.spawner.update(currentTime, this.state.aircraft);
    if (newAircraft) {
      this.state.aircraft.push(newAircraft);
      this.updateFlightStrips();
    }

    // Increase difficulty every 5 landings
    if (this.scoring.getLanded() > 0 && this.scoring.getLanded() % 5 === 0) {
      this.spawner.increaseDifficulty();
    }
  }

  private render(): void {
    this.radar.render(this.state.aircraft, this.state.selectedAircraftId, this.conflicts);
  }

  private renderGameOver(): void {
    const ctx = (document.getElementById('radar-canvas') as HTMLCanvasElement).getContext('2d')!;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('COLLISION', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

    ctx.fillStyle = '#00ff00';
    ctx.font = '24px Courier New';
    ctx.fillText(`Final Score: ${this.scoring.getScore()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    ctx.fillText(`Landed: ${this.scoring.getLanded()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  }

  private updateUI(): void {
    const scoreEl = document.getElementById('score');
    const countEl = document.getElementById('aircraft-count');
    const landedEl = document.getElementById('landed-count');

    if (scoreEl) scoreEl.textContent = String(this.scoring.getScore());
    if (countEl) countEl.textContent = String(
      this.state.aircraft.filter(a => a.status !== 'landed' && a.status !== 'departed').length
    );
    if (landedEl) landedEl.textContent = String(this.scoring.getLanded());

    this.updateFlightStrips();
  }

  private updateFlightStrips(): void {
    const container = document.getElementById('strips-container');
    if (!container) return;

    container.innerHTML = '';
    const active = this.state.aircraft.filter(a => a.status !== 'landed' && a.status !== 'departed');

    active.forEach(ac => {
      const strip = document.createElement('div');
      const typeClass = ac.isArrival ? 'arrival' : 'departure';
      const holdingClass = ac.status === 'holding' ? ' holding' : '';
      const selectedClass = ac.id === this.state.selectedAircraftId ? ' selected' : '';
      strip.className = `flight-strip ${typeClass}${holdingClass}${selectedClass}`;

      // Status indicator
      let statusText = '';
      let statusColor = '#888';
      switch (ac.status) {
        case 'holding':
          statusText = 'READY';
          statusColor = '#ffff00';
          break;
        case 'taxiing':
          statusText = 'TAXI';
          statusColor = '#ff9900';
          break;
        case 'takeoff':
          statusText = 'T/O';
          statusColor = '#ff9900';
          break;
        case 'approach':
          statusText = `ILS ${ac.assignedRunway}`;
          statusColor = '#00ff00';
          break;
        case 'flying':
          if (ac.assignedWaypoint) {
            statusText = `→${ac.assignedWaypoint}`;
            statusColor = '#00ffff';
          }
          break;
      }

      const typeLabel = ac.isArrival ? 'ARR' : 'DEP';
      const typeColor = ac.isArrival ? '#00ffff' : '#ff9900';

      strip.innerHTML = `
        <strong>${ac.callsign}</strong> <span style="color: ${typeColor}">${typeLabel}</span>
        ${statusText ? `<span style="color: ${statusColor}; margin-left: 5px;">${statusText}</span>` : ''}
        <br>
        ALT: ${Math.round(ac.altitude)} → ${ac.targetAltitude}
        <br>
        HDG: ${Math.round(ac.heading)}° SPD: ${Math.round(ac.speed)}kt
      `;
      strip.addEventListener('click', () => {
        this.selectAircraft(ac);
      });
      container.appendChild(strip);
    });
  }
}
