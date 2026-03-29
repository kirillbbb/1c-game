import { Game } from './game/Game';

const root = document.querySelector<HTMLElement>('#app');
if (!root) {
    throw new Error('App root not found');
}

const game = new Game(root);
game.init();
