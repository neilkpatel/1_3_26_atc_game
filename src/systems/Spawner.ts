import { AircraftState } from '../types';
import { createAircraft } from '../entities/Aircraft';
import { MAX_AIRCRAFT, SPAWN_INTERVAL } from '../utils/constants';

export class Spawner {
  private lastSpawnTime: number = 0;
  private spawnInterval: number = SPAWN_INTERVAL;

  /**
   * Check if it's time to spawn a new aircraft
   */
  update(currentTime: number, currentAircraft: AircraftState[]): AircraftState | null {
    const activeCount = currentAircraft.filter(a => a.status !== 'landed' && a.status !== 'departed').length;

    if (activeCount >= MAX_AIRCRAFT) {
      return null;
    }

    if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
      this.lastSpawnTime = currentTime;

      // 70% arrivals, 30% departures
      const isArrival = Math.random() < 0.7;
      return createAircraft(isArrival);
    }

    return null;
  }

  /**
   * Decrease spawn interval to increase difficulty
   */
  increaseDifficulty(): void {
    this.spawnInterval = Math.max(5000, this.spawnInterval - 1000);
  }

  /**
   * Force spawn for initial aircraft
   */
  forceSpawn(isArrival: boolean): AircraftState {
    return createAircraft(isArrival);
  }
}
