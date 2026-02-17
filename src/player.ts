import { Position, Direction } from './types';
import { GameMap } from './map';

export class Player {
    private position: Position;
    private direction: Direction = 'right';
    private nextDirection: Direction | null = null;
    private speed: number = 2;
    private radius: number = 8;
    private mouthOpen: number = 0;
    private mouthDirection: number = 1;

    constructor(startX: number, startY: number) {
        this.position = { x: startX, y: startY };
    }

    public update(map: GameMap): void {
        // Try to change direction
        if (this.nextDirection) {
            const testPos = { ...this.position };
            this.moveInDirection(testPos, this.nextDirection);
            if (!map.checkCollision(testPos.x, testPos.y)) {
                this.direction = this.nextDirection;
                this.nextDirection = null;
            }
        }

        // Move in current direction
        const newPos = { ...this.position };
        this.moveInDirection(newPos, this.direction);
        
        if (!map.checkCollision(newPos.x, newPos.y)) {
            this.position = newPos;
        }

        // Animate mouth
        this.mouthOpen += this.mouthDirection * 0.1;
        if (this.mouthOpen > 1) {
            this.mouthOpen = 1;
            this.mouthDirection = -1;
        } else if (this.mouthOpen < 0) {
            this.mouthOpen = 0;
            this.mouthDirection = 1;
        }
    }

    private moveInDirection(pos: Position, dir: Direction): void {
        switch(dir) {
            case 'up': pos.y -= this.speed; break;
            case 'down': pos.y += this.speed; break;
            case 'left': pos.x -= this.speed; break;
            case 'right': pos.x += this.speed; break;
        }
    }

    public setDirection(dir: Direction): void {
        this.nextDirection = dir;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Rotate based on direction
        switch(this.direction) {
            case 'up': ctx.rotate(-Math.PI / 2); break;
            case 'down': ctx.rotate(Math.PI / 2); break;
            case 'left': ctx.rotate(Math.PI); break;
            case 'right': break;
        }

        // Draw Pac-Man
        ctx.beginPath();
        ctx.fillStyle = '#ff0';
        ctx.arc(0, 0, this.radius, 
            this.mouthOpen * 0.2 * Math.PI, 
            (2 - this.mouthOpen * 0.2) * Math.PI
        );
        ctx.lineTo(0, 0);
        ctx.fill();
        
        ctx.restore();
    }

    public getPosition(): Position {
        return this.position;
    }

    public getRadius(): number {
        return this.radius;
    }
} 