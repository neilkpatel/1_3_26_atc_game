import { AircraftState, Command } from '../types';
import { setHeading, setAltitude, setSpeed, clearForApproach } from '../entities/Aircraft';

export class InputHandler {
  constructor(private canvas: HTMLCanvasElement) {
    this.setupCanvasListeners();
    this.setupCommandListeners();
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
      this.dispatchCommand({ type: 'approach' });
    });
  }

  private dispatchCommand(command: Command): void {
    const event = new CustomEvent('atc-command', { detail: command });
    window.dispatchEvent(event);
  }

  updateCommandPanel(aircraft: AircraftState | null): void {
    const panel = document.getElementById('command-panel');
    const callsignSpan = document.getElementById('selected-callsign');

    if (aircraft && panel && callsignSpan) {
      panel.classList.add('active');
      callsignSpan.textContent = aircraft.callsign;

      // Update input values
      (document.getElementById('cmd-heading') as HTMLInputElement).value =
        String(Math.round(aircraft.targetHeading));
      (document.getElementById('cmd-altitude') as HTMLInputElement).value =
        String(Math.round(aircraft.targetAltitude));
      (document.getElementById('cmd-speed') as HTMLInputElement).value =
        String(Math.round(aircraft.targetSpeed));
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
      case 'approach':
        clearForApproach(aircraft);
        break;
    }
  }
}
