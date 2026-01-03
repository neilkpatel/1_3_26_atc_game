import { AircraftState } from '../types';
import { RADAR_CENTER, RADAR_RADIUS, RUNWAY } from '../utils/constants';
import { toRadians } from '../utils/math';
import { getDataTag } from '../entities/Aircraft';
import { ConflictPair, isInConflict } from '../systems/Collision';

export class Radar {
  private ctx: CanvasRenderingContext2D;
  private sweepAngle: number = 0;
  private readonly SWEEP_SPEED = 0.5; // radians per second

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
  }

  update(deltaTime: number): void {
    this.sweepAngle += this.SWEEP_SPEED * deltaTime;
    if (this.sweepAngle >= Math.PI * 2) {
      this.sweepAngle -= Math.PI * 2;
    }
  }

  render(
    aircraft: AircraftState[],
    selectedId: string | null,
    conflicts: ConflictPair[]
  ): void {
    const ctx = this.ctx;

    // Clear and fill background
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw radar scope circle
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(RADAR_CENTER, RADAR_CENTER, RADAR_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Draw range rings
    ctx.strokeStyle = '#003300';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(RADAR_CENTER, RADAR_CENTER, (RADAR_RADIUS / 3) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw compass headings
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'center';
    const headings = [
      { angle: 0, label: 'N' },
      { angle: 90, label: 'E' },
      { angle: 180, label: 'S' },
      { angle: 270, label: 'W' },
    ];
    headings.forEach(({ angle, label }) => {
      const rad = toRadians(angle - 90); // adjust for canvas coords
      const x = RADAR_CENTER + (RADAR_RADIUS + 15) * Math.cos(rad);
      const y = RADAR_CENTER + (RADAR_RADIUS + 15) * Math.sin(rad);
      ctx.fillText(label, x, y + 4);
    });

    // Draw runway
    this.drawRunway();

    // Draw sweep line
    ctx.strokeStyle = '#00ff0044';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(RADAR_CENTER, RADAR_CENTER);
    ctx.lineTo(
      RADAR_CENTER + RADAR_RADIUS * Math.cos(this.sweepAngle),
      RADAR_CENTER + RADAR_RADIUS * Math.sin(this.sweepAngle)
    );
    ctx.stroke();

    // Draw sweep glow
    const gradient = ctx.createRadialGradient(
      RADAR_CENTER, RADAR_CENTER, 0,
      RADAR_CENTER, RADAR_CENTER, RADAR_RADIUS
    );
    gradient.addColorStop(0, 'rgba(0, 255, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(RADAR_CENTER, RADAR_CENTER);
    ctx.arc(RADAR_CENTER, RADAR_CENTER, RADAR_RADIUS, this.sweepAngle - 0.3, this.sweepAngle);
    ctx.closePath();
    ctx.fill();

    // Draw aircraft
    aircraft.forEach(ac => {
      if (!ac.landed && !ac.departed) {
        this.drawAircraft(ac, ac.id === selectedId, isInConflict(ac.id, conflicts));
      }
    });
  }

  private drawRunway(): void {
    const ctx = this.ctx;
    const runway = RUNWAY;
    const rad = toRadians(runway.heading - 90);

    ctx.save();
    ctx.translate(runway.position.x, runway.position.y);
    ctx.rotate(rad);

    // Runway rectangle
    ctx.fillStyle = '#004400';
    ctx.fillRect(-runway.length / 2, -4, runway.length, 8);

    // Runway markings
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(-runway.length / 2, 0);
    ctx.lineTo(runway.length / 2, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

    // Runway label
    ctx.fillStyle = '#00ff00';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(runway.id, runway.position.x, runway.position.y + 20);
  }

  private drawAircraft(ac: AircraftState, isSelected: boolean, inConflict: boolean): void {
    const ctx = this.ctx;
    const { x, y } = ac.position;

    // Aircraft blip
    ctx.beginPath();
    if (inConflict) {
      ctx.fillStyle = '#ff0000';
    } else if (isSelected) {
      ctx.fillStyle = '#ffff00';
    } else {
      ctx.fillStyle = '#00ff00';
    }
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Heading line
    const headingRad = toRadians(ac.heading - 90);
    ctx.strokeStyle = isSelected ? '#ffff00' : '#00ff00';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 20 * Math.cos(headingRad), y + 20 * Math.sin(headingRad));
    ctx.stroke();

    // Data tag
    ctx.fillStyle = inConflict ? '#ff0000' : (isSelected ? '#ffff00' : '#00ff00');
    ctx.font = '10px Courier New';
    ctx.textAlign = 'left';
    const tag = getDataTag(ac);
    const lines = tag.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, x + 10, y - 5 + i * 12);
    });

    // Selection ring
    if (isSelected) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Conflict flash
    if (inConflict && Math.floor(Date.now() / 250) % 2 === 0) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /**
   * Get aircraft at click position
   */
  getAircraftAtPosition(
    x: number,
    y: number,
    aircraft: AircraftState[]
  ): AircraftState | null {
    const clickRadius = 15;
    for (const ac of aircraft) {
      if (ac.landed || ac.departed) continue;
      const dx = ac.position.x - x;
      const dy = ac.position.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < clickRadius) {
        return ac;
      }
    }
    return null;
  }
}
