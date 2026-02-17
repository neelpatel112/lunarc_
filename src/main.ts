import { Game } from './game';

// Initialize game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game('gameCanvas');
    game.start();
});