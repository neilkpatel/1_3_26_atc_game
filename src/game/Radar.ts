import { AircraftState, Runway } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CENTER_X, CENTER_Y, RUNWAYS } from '../utils/constants';
import { toRadians, normalizeHeading } from '../utils/math';
import { getDataTag } from '../entities/Aircraft';
import { ConflictPair, isInConflict } from '../systems/Collision';

export class Radar {
  private ctx: CanvasRenderingContext2D;
  private sweepAngle: number = 0;
  private readonly SWEEP_SPEED = 0.3; // radians per second

  constructor(canvas: HTMLCanvasElement) {
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
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid lines
    this.drawGrid();

    // Draw compass headings at edges
    this.drawCompass();

    // Draw all runways
    RUNWAYS.forEach(runway => this.drawRunway(runway));

    // Draw sweep line from center
    this.drawSweep();

    // Draw aircraft
    aircraft.forEach(ac => {
      if (!ac.landed && !ac.departed) {
        this.drawAircraft(ac, ac.id === selectedId, isInConflict(ac.id, conflicts));
      }
    });
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = '#002200';
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let y = 50; y < CANVAS_HEIGHT; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let x = 50; x < CANVAS_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Draw range circles from center
    ctx.strokeStyle = '#003300';
    const maxRadius = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 2 - 30;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(CENTER_X, CENTER_Y, (maxRadius / 3) * i, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawCompass(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#00ff00';
    ctx.font = '14px Courier New';
    ctx.textAlign = 'center';

    // N at top
    ctx.fillText('N', CENTER_X, 20);
    // S at bottom
    ctx.fillText('S', CENTER_X, CANVAS_HEIGHT - 10);
    // E at right
    ctx.textAlign = 'left';
    ctx.fillText('E', CANVAS_WIDTH - 20, CENTER_Y + 5);
    // W at left
    ctx.textAlign = 'right';
    ctx.fillText('W', 20, CENTER_Y + 5);
  }

  private drawSweep(): void {
    const ctx = this.ctx;
    const maxRadius = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 2;

    // Draw sweep line
    ctx.strokeStyle = '#00ff0033';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CENTER_X, CENTER_Y);
    ctx.lineTo(
      CENTER_X + maxRadius * Math.cos(this.sweepAngle),
      CENTER_Y + maxRadius * Math.sin(this.sweepAngle)
    );
    ctx.stroke();

    // Draw sweep glow
    const gradient = ctx.createRadialGradient(
      CENTER_X, CENTER_Y, 0,
      CENTER_X, CENTER_Y, maxRadius
    );
    gradient.addColorStop(0, 'rgba(0, 255, 0, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(CENTER_X, CENTER_Y);
    ctx.arc(CENTER_X, CENTER_Y, maxRadius, this.sweepAngle - 0.2, this.sweepAngle);
    ctx.closePath();
    ctx.fill();
  }

  private drawRunway(runway: Runway): void {
    const ctx = this.ctx;
    const rad = toRadians(runway.heading - 90);

    ctx.save();
    ctx.translate(runway.position.x, runway.position.y);
    ctx.rotate(rad);

    // Runway rectangle
    ctx.fillStyle = '#004400';
    ctx.fillRect(-runway.length / 2, -5, runway.length, 10);

    // Runway center line
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(-runway.length / 2 + 10, 0);
    ctx.lineTo(runway.length / 2 - 10, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Threshold markings
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(-runway.length / 2, -4, 3, 8);
    ctx.fillRect(runway.length / 2 - 3, -4, 3, 8);

    ctx.restore();

    // Draw runway numbers at both ends
    const primaryHeading = runway.heading;
    const oppositeHeading = normalizeHeading(runway.heading + 180);

    // Format runway numbers (divide by 10, pad to 2 digits)
    const primaryNum = String(Math.round(primaryHeading / 10)).padStart(2, '0');
    const oppositeNum = String(Math.round(oppositeHeading / 10) || 36).padStart(2, '0');

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 11px Courier New';
    ctx.textAlign = 'center';

    // Calculate label positions at runway ends
    const labelOffset = runway.length / 2 + 18;
    const endX1 = runway.position.x + labelOffset * Math.cos(rad);
    const endY1 = runway.position.y + labelOffset * Math.sin(rad);
    const endX2 = runway.position.x - labelOffset * Math.cos(rad);
    const endY2 = runway.position.y - labelOffset * Math.sin(rad);

    // Primary heading label (at the end you land on when using this heading)
    ctx.fillText(primaryNum, endX2, endY2 + 4);
    // Opposite heading label
    ctx.fillText(oppositeNum, endX1, endY1 + 4);
  }

  private drawAircraft(ac: AircraftState, isSelected: boolean, inConflict: boolean): void {
    const ctx = this.ctx;
    const { x, y } = ac.position;

    // Determine color based on type
    let color = ac.isArrival ? '#00ffff' : '#ff9900'; // Cyan for arrivals, orange for departures
    if (inConflict) {
      color = '#ff0000';
    } else if (isSelected) {
      color = '#ffff00';
    }

    // Draw tail line BEHIND the aircraft (opposite of heading)
    const tailRad = toRadians(ac.heading - 90 + 180); // Opposite direction
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 18 * Math.cos(tailRad), y + 18 * Math.sin(tailRad));
    ctx.stroke();

    // Aircraft blip (nose - the front)
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Data tag
    ctx.fillStyle = color;
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
