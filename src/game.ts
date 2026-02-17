import { GameMap } from './map';
import { Player } from './player';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private map: GameMap;
    private player: Player;
    private score: number = 0;
    private gameLoop: number = 0;
    private keys: Set<string> = new Set();

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        // Initialize game objects
        this.map = new GameMap(this.ctx);
        this.player = new Player(300, 300); // Start in the middle
        
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.key);
            this.handleInput();
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.key);
        });
    }

    private handleInput(): void {
        if (this.keys.has('ArrowUp')) {
            this.player.setDirection('up');
        } else if (this.keys.has('ArrowDown')) {
            this.player.setDirection('down');
        } else if (this.keys.has('ArrowLeft')) {
            this.player.setDirection('left');
        } else if (this.keys.has('ArrowRight')) {
            this.player.setDirection('right');
        }
    }

    public start(): void {
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    private update(): void {
        // Update game objects
        this.player.update(this.map);
        
        // Check pellet collection
        const playerPos = this.player.getPosition();
        if (this.map.removePellet(playerPos.x, playerPos.y)) {
            this.score += 10;
            this.updateScore();
        }

        // Draw everything
        this.draw();

        // Continue game loop
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    private draw(): void {
        this.map.draw();
        this.player.draw(this.ctx);
    }

    private updateScore(): void {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = this.score.toString();
        }
    }

    public stop(): void {
        cancelAnimationFrame(this.gameLoop);
    }
} 