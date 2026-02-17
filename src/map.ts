import { MapData, Wall, Position } from './types';

export class GameMap {
    private mapData: MapData;
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        this.mapData = this.createMap();
    }

    private createMap(): MapData {
        const cellSize = 20;
        const walls: Wall[] = [];
        const pellets: Position[] = [];
        
        // Create outer walls (the long way of walls)
        // Top wall
        walls.push({ x: 0, y: 0, width: 30, height: 1 });
        // Bottom wall
        walls.push({ x: 0, y: 29, width: 30, height: 1 });
        // Left wall
        walls.push({ x: 0, y: 1, width: 1, height: 28 });
        // Right wall
        walls.push({ x: 29, y: 1, width: 1, height: 28 });

        // Inner maze walls - classic Pac-Man style
        const innerWalls = [
            // Top rectangle
            { x: 5, y: 5, width: 20, height: 2 },
            { x: 5, y: 8, width: 2, height: 5 },
            { x: 23, y: 8, width: 2, height: 5 },
            
            // Middle section
            { x: 10, y: 12, width: 10, height: 2 },
            { x: 5, y: 15, width: 2, height: 5 },
            { x: 23, y: 15, width: 2, height: 5 },
            
            // Bottom section
            { x: 5, y: 22, width: 20, height: 2 },
            { x: 12, y: 18, width: 6, height: 2 },
        ];

        walls.push(...innerWalls);

        // Add pellets in empty spaces
        for (let y = 1; y < 29; y++) {
            for (let x = 1; x < 29; x++) {
                if (!this.isWallAt(x, y, walls)) {
                    pellets.push({ x, y });
                }
            }
        }

        return {
            walls,
            pellets,
            powerPellets: [
                { x: 2, y: 2 },
                { x: 27, y: 2 },
                { x: 2, y: 27 },
                { x: 27, y: 27 }
            ],
            width: 30,
            height: 30,
            cellSize
        };
    }

    private isWallAt(x: number, y: number, walls: Wall[]): boolean {
        return walls.some(wall => 
            x >= wall.x && x < wall.x + wall.width &&
            y >= wall.y && y < wall.y + wall.height
        );
    }

    public draw(): void {
        // Draw background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, 600, 600);

        // Draw walls
        this.ctx.fillStyle = '#00f';
        this.mapData.walls.forEach(wall => {
            this.ctx.fillRect(
                wall.x * this.mapData.cellSize,
                wall.y * this.mapData.cellSize,
                wall.width * this.mapData.cellSize,
                wall.height * this.mapData.cellSize
            );
        });

        // Draw pellets
        this.ctx.fillStyle = '#ff0';
        this.mapData.pellets.forEach(pellet => {
            this.ctx.beginPath();
            this.ctx.arc(
                pellet.x * this.mapData.cellSize + this.mapData.cellSize / 2,
                pellet.y * this.mapData.cellSize + this.mapData.cellSize / 2,
                2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });

        // Draw power pellets
        this.ctx.fillStyle = '#ff0';
        this.mapData.powerPellets.forEach(pellet => {
            this.ctx.beginPath();
            this.ctx.arc(
                pellet.x * this.mapData.cellSize + this.mapData.cellSize / 2,
                pellet.y * this.mapData.cellSize + this.mapData.cellSize / 2,
                5,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
    }

    public getMapData(): MapData {
        return this.mapData;
    }

    public checkCollision(x: number, y: number): boolean {
        const cellX = Math.floor(x / this.mapData.cellSize);
        const cellY = Math.floor(y / this.mapData.cellSize);
        
        return this.mapData.walls.some(wall => 
            cellX >= wall.x && cellX < wall.x + wall.width &&
            cellY >= wall.y && cellY < wall.y + wall.height
        );
    }

    public removePellet(x: number, y: number): boolean {
        const cellX = Math.floor(x / this.mapData.cellSize);
        const cellY = Math.floor(y / this.mapData.cellSize);
        
        const pelletIndex = this.mapData.pellets.findIndex(
            p => p.x === cellX && p.y === cellY
        );
        
        if (pelletIndex !== -1) {
            this.mapData.pellets.splice(pelletIndex, 1);
            return true;
        }
        
        return false;
    }
} 