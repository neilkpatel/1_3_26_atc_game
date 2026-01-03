import { AircraftState, Command } from '../types';
import { setHeading, setAltitude, setSpeed, clearForApproach, clearForTakeoff, assignWaypoint } from '../entities/Aircraft';
import { getAllRunwayLabels, WAYPOINTS } from '../utils/constants';

export class InputHandler {
  constructor(private canvas: HTMLCanvasElement) {
    this.setupCanvasListeners();
    this.setupCommandListeners();
    this.populateDropdowns();
  }

  private populateDropdowns(): void {
    // Populate runway dropdowns
    const runwayLabels = getAllRunwayLabels();
    const approachSelect = document.getElementById('cmd-approach-runway') as HTMLSelectElement;
    const takeoffSelect = document.getElementById('cmd-takeoff-runway') as HTMLSelectElement;

    runwayLabels.forEach(label => {
      if (approachSelect) {
        const option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        approachSelect.appendChild(option);
      }
      if (takeoffSelect) {
        const option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        takeoffSelect.appendChild(option);
      }
    });

    // Populate waypoint dropdown
    const waypointSelect = document.getElementById('cmd-waypoint') as HTMLSelectElement;
    WAYPOINTS.forEach(wp => {
      if (waypointSelect) {
        const option = document.createElement('option');
        option.value = wp.id;
        option.textContent = wp.label;
        waypointSelect.appendChild(option);
      }
    });
  }

  private setupCanvasListeners(): void {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // This will be called from Game with the aircraft list
      (window as unknown as { handleRadarClick: (x: number, y: number) => void }).handleRadarClick(x, y);
    });
  }

  private setupCommandListeners(): void {
    const btnHeading = document.getElementById('btn-heading');
    const btnAltitude = document.getElementById('btn-altitude');
    const btnSpeed = document.getElementById('btn-speed');
    const btnApproach = document.getElementById('btn-approach');
    const btnTakeoff = document.getElementById('btn-takeoff');
    const btnWaypoint = document.getElementById('btn-waypoint');

    btnHeading?.addEventListener('click', () => {
      const input = document.getElementById('cmd-heading') as HTMLInputElement;
      const value = parseInt(input.value);
      if (!isNaN(value)) {
        this.dispatchCommand({ type: 'heading', value });
      }
    });

    btnAltitude?.addEventListener('click', () => {
      const input = document.getElementById('cmd-altitude') as HTMLInputElement;
      const value = parseInt(input.value);
      if (!isNaN(value)) {
        this.dispatchCommand({ type: 'altitude', value });
      }
    });

    btnSpeed?.addEventListener('click', () => {
      const input = document.getElementById('cmd-speed') as HTMLInputElement;
      const value = parseInt(input.value);
      if (!isNaN(value)) {
        this.dispatchCommand({ type: 'speed', value });
      }
    });

    btnApproach?.addEventListener('click', () => {
      const select = document.getElementById('cmd-approach-runway') as HTMLSelectElement;
      const runwayId = select.value;
      if (runwayId) {
        this.dispatchCommand({ type: 'runway', runwayId });
      }
    });

    btnTakeoff?.addEventListener('click', () => {
      const select = document.getElementById('cmd-takeoff-runway') as HTMLSelectElement;
      const runwayId = select.value;
      if (runwayId) {
        this.dispatchCommand({ type: 'takeoff', runwayId });
      }
    });

    btnWaypoint?.addEventListener('click', () => {
      const select = document.getElementById('cmd-waypoint') as HTMLSelectElement;
      const waypointId = select.value;
      if (waypointId) {
        this.dispatchCommand({ type: 'waypoint', waypointId });
      }
    });
  }

  private dispatchCommand(command: Command): void {
    const event = new CustomEvent('atc-command', { detail: command });
    window.dispatchEvent(event);
  }

  updateCommandPanel(aircraft: AircraftState | null): void {
    const panel = document.getElementById('command-panel');
    const callsignSpan = document.getElementById('selected-callsign');
    const typeSpan = document.getElementById('selected-type');
    const vectorCommands = document.getElementById('vector-commands');
    const arrivalCommands = document.getElementById('arrival-commands');
    const departureCommands = document.getElementById('departure-commands');
    const waypointCommands = document.getElementById('waypoint-commands');

    if (aircraft && panel && callsignSpan) {
      panel.classList.add('active');
      callsignSpan.textContent = aircraft.callsign;

      // Update type indicator
      if (typeSpan) {
        if (aircraft.status === 'holding') {
          typeSpan.textContent = 'RDY';
          typeSpan.className = 'aircraft-type dep';
        } else {
          typeSpan.textContent = aircraft.isArrival ? 'ARR' : 'DEP';
          typeSpan.className = 'aircraft-type ' + (aircraft.isArrival ? 'arr' : 'dep');
        }
      }

      // Show/hide command sections based on aircraft type and status
      const isFlying = aircraft.status === 'flying';
      const isHolding = aircraft.status === 'holding';
      const isArrival = aircraft.isArrival;
      const canBeCleared = isArrival && isFlying && !aircraft.assignedRunway;

      // Vector commands - only for flying aircraft
      if (vectorCommands) {
        vectorCommands.style.display = isFlying ? 'block' : 'none';
      }

      // Arrival commands - only for arrivals that haven't been cleared
      if (arrivalCommands) {
        arrivalCommands.style.display = canBeCleared ? 'block' : 'none';
      }

      // Departure commands - only for holding departures
      if (departureCommands) {
        departureCommands.style.display = (!isArrival && isHolding) ? 'block' : 'none';
      }

      // Waypoint commands - for flying aircraft
      if (waypointCommands) {
        waypointCommands.style.display = isFlying ? 'block' : 'none';
      }

      // Update input values for flying aircraft
      if (isFlying) {
        (document.getElementById('cmd-heading') as HTMLInputElement).value =
          String(Math.round(aircraft.targetHeading));
        (document.getElementById('cmd-altitude') as HTMLInputElement).value =
          String(Math.round(aircraft.targetAltitude));
        (document.getElementById('cmd-speed') as HTMLInputElement).value =
          String(Math.round(aircraft.targetSpeed));
      }
    } else if (panel) {
      panel.classList.remove('active');
    }
  }

  static applyCommand(aircraft: AircraftState, command: Command): void {
    switch (command.type) {
      case 'heading':
        if (command.value !== undefined) {
          setHeading(aircraft, command.value);
        }
        break;
      case 'altitude':
        if (command.value !== undefined) {
          setAltitude(aircraft, command.value);
        }
        break;
      case 'speed':
        if (command.value !== undefined) {
          setSpeed(aircraft, command.value);
        }
        break;
      case 'runway':
        if (command.runwayId) {
          clearForApproach(aircraft, command.runwayId);
        }
        break;
      case 'takeoff':
        if (command.runwayId) {
          clearForTakeoff(aircraft, command.runwayId);
        }
        break;
      case 'waypoint':
        if (command.waypointId) {
          assignWaypoint(aircraft, command.waypointId);
        }
        break;
    }
  }
}
