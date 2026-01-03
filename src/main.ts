import { Game } from './game/Game';

const canvas = document.getElementById('radar-canvas') as HTMLCanvasElement;

if (canvas) {
  const game = new Game(canvas);
  game.start();
}
