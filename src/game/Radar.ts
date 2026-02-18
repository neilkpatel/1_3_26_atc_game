import { AircraftState, Runway, Waypoint, UFOState } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CENTER_X, CENTER_Y, RUNWAYS, WAYPOINTS } from '../utils/constants';
import { toRadians } from '../utils/math';
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

    // Draw waypoints
    WAYPOINTS.forEach(wp => this.drawWaypoint(wp));

    // Draw all runways
    RUNWAYS.forEach(runway => this.drawRunway(runway));

    // Draw airport name
    this.drawAirportName();

    // Draw sweep line from center
    this.drawSweep();

    // Draw aircraft
    aircraft.forEach(ac => {
      if (ac.status !== 'landed' && ac.status !== 'departed') {
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

  private drawWaypoint(wp: Waypoint): void {
    const ctx = this.ctx;
    const { x, y } = wp.position;

    // Draw triangle
    ctx.strokeStyle = '#00aa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x - 7, y + 5);
    ctx.lineTo(x + 7, y + 5);
    ctx.closePath();
    ctx.stroke();

    // Draw label
    ctx.fillStyle = '#00aa00';
    ctx.font = 'bold 10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(wp.label, x, y + 20);
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

    // Draw runway labels at both ends (using labelPrimary and labelSecondary)
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 11px Courier New';
    ctx.textAlign = 'center';

    // Calculate label positions at runway ends
    const labelOffset = runway.length / 2 + 18;
    const endX1 = runway.position.x + labelOffset * Math.cos(rad);
    const endY1 = runway.position.y + labelOffset * Math.sin(rad);
    const endX2 = runway.position.x - labelOffset * Math.cos(rad);
    const endY2 = runway.position.y - labelOffset * Math.sin(rad);

    // Primary label (at the threshold for that direction)
    ctx.fillText(runway.labelPrimary, endX2, endY2 + 4);
    // Secondary label (opposite end)
    ctx.fillText(runway.labelSecondary, endX1, endY1 + 4);
  }

  private drawAirportName(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#005500';
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('METAVERSE INTL', CENTER_X, CENTER_Y - 65);
    ctx.font = '9px Courier New';
    ctx.fillText('KMVR', CENTER_X, CENTER_Y - 53);
  }

  private drawAircraft(ac: AircraftState, isSelected: boolean, inConflict: boolean): void {
    const ctx = this.ctx;
    const { x, y } = ac.position;

    // Determine color based on type and status
    let color = ac.isArrival ? '#00ffff' : '#ff9900';
    if (ac.status === 'holding') color = '#ffff00';
    if (inConflict) {
      color = '#ff0000';
    } else if (isSelected) {
      color = '#ffffff';
    }

    ctx.save();
    ctx.translate(x, y);

    if (ac.status === 'holding') {
      // Square for holding aircraft
      ctx.fillStyle = color;
      ctx.fillRect(-4, -4, 8, 8);
    } else {
      // Rotate to heading direction
      ctx.rotate(toRadians(ac.heading));

      // Delta Airlines logo — 4 sections with chevron gap
      const brightRed = inConflict ? '#ff3333' : (isSelected ? '#ffffff' : '#E01A2B');
      const darkRed = inConflict ? '#cc0000' : (isSelected ? '#cccccc' : '#9E1B34');

      // Top-left (bright red)
      ctx.fillStyle = brightRed;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(-10, 2);
      ctx.lineTo(0, 8);
      ctx.closePath();
      ctx.fill();

      // Top-right (dark red)
      ctx.fillStyle = darkRed;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(0, 8);
      ctx.lineTo(10, 2);
      ctx.closePath();
      ctx.fill();

      // Bottom-left (bright red)
      ctx.fillStyle = brightRed;
      ctx.beginPath();
      ctx.moveTo(-11, 5);
      ctx.lineTo(-16, 14);
      ctx.lineTo(0, 14);
      ctx.lineTo(0, 11);
      ctx.closePath();
      ctx.fill();

      // Bottom-right (dark red)
      ctx.fillStyle = darkRed;
      ctx.beginPath();
      ctx.moveTo(11, 5);
      ctx.lineTo(0, 11);
      ctx.lineTo(0, 14);
      ctx.lineTo(16, 14);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // Data tag
    ctx.fillStyle = color;
    ctx.font = '10px Courier New';
    ctx.textAlign = 'left';
    const tag = getDataTag(ac);
    const lines = tag.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, x + 14, y - 5 + i * 12);
    });

    // Selection ring
    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Conflict flash
    if (inConflict && Math.floor(Date.now() / 250) % 2 === 0) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  renderUFOs(ufos: UFOState[]): void {
    ufos.forEach(ufo => this.drawUFO(ufo));
  }

  private drawUFO(ufo: UFOState): void {
    const ctx = this.ctx;
    const { x, y } = ufo.position;
    const time = Date.now();

    ctx.save();
    ctx.translate(x, y);

    // Glow effect
    const glowAlpha = 0.15 + 0.1 * Math.sin(time / 200);
    ctx.fillStyle = `rgba(180, 0, 255, ${glowAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Saucer body (ellipse)
    ctx.fillStyle = '#7a7a8a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#aaaacc';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dome on top
    ctx.fillStyle = '#aaddcc';
    ctx.beginPath();
    ctx.ellipse(0, -3, 6, 5, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#ccffee';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Dome shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-2, -5, 2, 1.5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Flashing lights around the rim
    const colors = ['#ff0055', '#00ff88', '#5555ff', '#ffff00', '#ff00ff', '#00ffff'];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const lx = Math.cos(angle) * 12;
      const ly = Math.sin(angle) * 3.5;
      const colorIndex = (i + Math.floor(time / 120)) % colors.length;
      const blink = Math.sin(time / 80 + i * 1.5) > 0;
      if (blink) {
        ctx.fillStyle = colors[colorIndex];
        ctx.beginPath();
        ctx.arc(lx, ly, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // Label with question marks
    ctx.fillStyle = '#cc00ff';
    ctx.font = 'bold 9px Courier New';
    ctx.textAlign = 'center';
    const labelFlicker = Math.floor(time / 300) % 3;
    const labels = ['???', 'UFO', '👽'];
    ctx.fillText(labels[labelFlicker], x, y - 14);
  }

  /**
   * Get aircraft at click position
   */
  getAircraftAtPosition(
    x: number,
    y: number,
    aircraft: AircraftState[]
  ): AircraftState | null {
    const clickRadius = 22;
    for (const ac of aircraft) {
      if (ac.status === 'landed' || ac.status === 'departed') continue;
      const dx = ac.position.x - x;
      const dy = ac.position.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < clickRadius) {
        return ac;
      }
    }
    return null;
  }
}
