import { POINTS_PER_LANDING, POINTS_PER_DEPARTURE, CONFLICT_PENALTY } from '../utils/constants';

export class Scoring {
  private score: number = 0;
  private landed: number = 0;
  private departed: number = 0;
  private conflictPenalties: number = 0;

  addLanding(): void {
    this.score += POINTS_PER_LANDING;
    this.landed++;
  }

  addDeparture(): void {
    this.score += POINTS_PER_DEPARTURE;
    this.departed++;
  }

  addConflictPenalty(): void {
    this.score = Math.max(0, this.score - CONFLICT_PENALTY);
    this.conflictPenalties++;
  }

  getScore(): number {
    return this.score;
  }

  getLanded(): number {
    return this.landed;
  }

  getDeparted(): number {
    return this.departed;
  }

  getStats() {
    return {
      score: this.score,
      landed: this.landed,
      departed: this.departed,
      conflictPenalties: this.conflictPenalties,
    };
  }
}
