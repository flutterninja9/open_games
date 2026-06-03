import Phaser from 'phaser';
import { FaultLineScene } from './FaultLineScene';

export function createGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 520,
    parent,
    backgroundColor: '#0d0d0d',
    physics: {
      default: 'matter',
      matter: {
        gravity: { x: 0, y: 1.5 },
        debug: false
      }
    },
    scene: FaultLineScene
  };
  return new Phaser.Game(config);
}
