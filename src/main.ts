// src/main.ts - DOOM Engine in TypeScript

interface Player {
    x: number;
    y: number;
    dirX: number;
    dirY: number;
    planeX: number;
    planeY: number;
    health: number;
    ammo: number;
    weapon: number;
}

interface Texture {
    width: number;
    height: number;
    pixels: Uint32Array;
}

class DoomEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private miniMapCanvas: HTMLCanvasElement;
    private miniMapCtx: CanvasRenderingContext2D;
    
    // Screen dimensions
    private readonly width = 1024;
    private readonly height = 768;
    
    // Player
    private player: Player;
    
    // Map - LARGE MAP (32x32)
    private readonly mapWidth = 32;
    private readonly mapHeight = 32;
    private worldMap: number[][];
    
    // Textures
    private textures: Texture[] = [];
    private readonly texWidth = 64;
    private readonly texHeight = 64;
    
    // Colors for floor/ceiling
    private readonly floorColor = 0x402010;  // Dark brown
    private readonly ceilingColor = 0x201010; // Very dark brown
    
    // FPS calculation
    private frameCount = 0;
    private lastTime = performance.now();
    private fps = 0;
    
    constructor() {
        // Get canvases
        this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d', { alpha: false })!;
        this.miniMapCanvas = document.getElementById('minimap') as HTMLCanvasElement;
        this.miniMapCtx = this.miniMapCanvas.getContext('2d')!;
        
        // Initialize player
        this.player = {
            x: 15.5,
            y: 15.5,
            dirX: -1,
            dirY: 0,
            planeX: 0,
            planeY: 0.66,
            health: 100,
            ammo: 50,
            weapon: 0
        };
        
        // Create HUGE map (32x32)
        this.worldMap = this.generateLargeMap();
        
        // Generate textures
        this.generateTextures();
        
        // Start game
        this.init();
    }
    
    // Generate a LARGE, interesting map
    private generateLargeMap(): number[][] {
        const map: number[][] = [];
        
        // Fill with empty space first
        for (let y = 0; y < this.mapHeight; y++) {
            map[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                map[y][x] = 0;
            }
        }
        
        // Create outer walls
        for (let x = 0; x < this.mapWidth; x++) {
            map[0][x] = 1;           // Top wall
            map[this.mapHeight-1][x] = 1; // Bottom wall
        }
        for (let y = 0; y < this.mapHeight; y++) {
            map[y][0] = 1;           // Left wall
            map[y][this.mapWidth-1] = 1; // Right wall
        }
        
        // Create a MAZE-like structure
        // Room 1 (top-left)
        for (let y = 3; y < 8; y++) {
            for (let x = 3; x < 8; x++) {
                if (Math.random() > 0.3) map[y][x] = Math.floor(Math.random() * 4) + 1;
            }
        }
        
        // Room 2 (top-right)
        for (let y = 3; y < 8; y++) {
            for (let x = 20; x < 28; x++) {
                if (Math.random() > 0.4) map[y][x] = Math.floor(Math.random() * 4) + 1;
            }
        }
        
        // Room 3 (bottom-left)
        for (let y = 20; y < 28; y++) {
            for (let x = 3; x < 8; x++) {
                if (Math.random() > 0.4) map[y][x] = Math.floor(Math.random() * 4) + 1;
            }
        }
        
        // Room 4 (bottom-right - BIG ROOM)
        for (let y = 20; y < 28; y++) {
            for (let x = 20; x < 28; x++) {
                if (Math.random() > 0.2) map[y][x] = Math.floor(Math.random() * 4) + 1;
            }
        }
        
        // Create corridors connecting rooms
        // Horizontal corridor
        for (let x = 8; x < 20; x++) {
            map[8][x] = 1;
            map[20][x] = 1;
        }
        
        // Vertical corridors
        for (let y = 8; y < 20; y++) {
            map[y][8] = 1;
            map[y][20] = 1;
        }
        
        // Add some pillars in the big room
        map[22][22] = 2;
        map[22][25] = 3;
        map[25][22] = 4;
        map[25][25] = 5;
        
        // Add some random pillars
        for (let i = 0; i < 10; i++) {
            const x = Math.floor(Math.random() * 28) + 2;
            const y = Math.floor(Math.random() * 28) + 2;
            if (map[y][x] === 0) {
                map[y][x] = Math.floor(Math.random() * 5) + 1;
            }
        }
        
        return map;
    }
    
    // Generate DOOM-style textures
    private generateTextures() {
        // Create 8 different textures
        for (let t = 0; t < 8; t++) {
            const pixels = new Uint32Array(this.texWidth * this.texHeight);
            
            for (let y = 0; y < this.texHeight; y++) {
                for (let x = 0; x < this.texWidth; x++) {
                    let color = 0;
                    
                    switch(t) {
                        case 0: // BRICK
                            if ((Math.floor(x/8) + Math.floor(y/8)) % 2 === 0) {
                                color = 0x8B4513; // Brown
                            } else {
                                color = 0xCD853F; // Peru brown
                            }
                            break;
                            
                        case 1: // STONE
                            color = 0x808080 + ((x ^ y) % 0x40);
                            break;
                            
                        case 2: // WOOD
                            if (y % 16 < 8) {
                                color = 0x8B4513; // Dark wood
                            } else {
                                color = 0xD2691E; // Chocolate
                            }
                            break;
                            
                        case 3: // METAL
                            color = 0x4A4A4A + ((x * y) % 0x30);
                            break;
                            
                        case 4: // DOOR
                            color = 0x654321; // Dark brown
                            break;
                            
                        case 5: // BLOODSTONE
                            if (x % 16 < 8 && y % 16 < 8) {
                                color = 0x8B0000; // Dark red
                            } else {
                                color = 0x5C4033; // Dark brown
                            }
                            break;
                            
                        case 6: // COMPUTER
                            if (x % 8 < 4 && y % 8 < 4) {
                                color = 0x00FF00; // Green
                            } else {
                                color = 0x006400; // Dark green
                            }
                            break;
                            
                        case 7: // MARBLE
                            color = 0xE0E0E0 - ((x + y) % 0x40);
                            break;
                    }
                    
                    pixels[y * this.texWidth + x] = color;
                }
            }
            
            this.textures.push({
                width: this.texWidth,
                height: this.texHeight,
                pixels: pixels
            });
        }
    }
    
    private init() {
        // Set up input handlers
        this.setupInput();
        
        // Start game loop
        this.gameLoop();
    }
    
    private setupInput() {
        const keys: { [key: string]: boolean } = {};
        
        window.addEventListener('keydown', (e) => {
            const key = e.key;
            keys[key] = true;
            
            // Movement
            const moveSpeed = 0.05;
            const rotSpeed = 0.03;
            
            if (keys['w'] || keys['W']) {
                // Move forward
                if (this.worldMap[Math.floor(this.player.y)][Math.floor(this.player.x + this.player.dirX * moveSpeed * 2)] === 0) {
                    this.player.x += this.player.dirX * moveSpeed;
                }
                if (this.worldMap[Math.floor(this.player.y + this.player.dirY * moveSpeed * 2)][Math.floor(this.player.x)] === 0) {
                    this.player.y += this.player.dirY * moveSpeed;
                }
            }
            
            if (keys['s'] || keys['S']) {
                // Move backward
                if (this.worldMap[Math.floor(this.player.y)][Math.floor(this.player.x - this.player.dirX * moveSpeed * 2)] === 0) {
                    this.player.x -= this.player.dirX * moveSpeed;
                }
                if (this.worldMap[Math.floor(this.player.y - this.player.dirY * moveSpeed * 2)][Math.floor(this.player.x)] === 0) {
                    this.player.y -= this.player.dirY * moveSpeed;
                }
            }
            
            if (keys['a'] || keys['A']) {
                // Strafe left
                const strafeX = -this.player.dirY * moveSpeed;
                const strafeY = this.player.dirX * moveSpeed;
                if (this.worldMap[Math.floor(this.player.y)][Math.floor(this.player.x + strafeX * 2)] === 0) {
                    this.player.x += strafeX;
                }
                if (this.worldMap[Math.floor(this.player.y + strafeY * 2)][Math.floor(this.player.x)] === 0) {
                    this.player.y += strafeY;
                }
            }
            
            if (keys['d'] || keys['D']) {
                // Strafe right
                const strafeX = this.player.dirY * moveSpeed;
                const strafeY = -this.player.dirX * moveSpeed;
                if (this.worldMap[Math.floor(this.player.y)][Math.floor(this.player.x + strafeX * 2)] === 0) {
                    this.player.x += strafeX;
                }
                if (this.worldMap[Math.floor(this.player.y + strafeY * 2)][Math.floor(this.player.x)] === 0) {
                    this.player.y += strafeY;
                }
            }
            
            if (keys['ArrowLeft']) {
                // Rotate left
                const oldDirX = this.player.dirX;
                this.player.dirX = this.player.dirX * Math.cos(-rotSpeed) - this.player.dirY * Math.sin(-rotSpeed);
                this.player.dirY = oldDirX * Math.sin(-rotSpeed) + this.player.dirY * Math.cos(-rotSpeed);
                
                const oldPlaneX = this.player.planeX;
                this.player.planeX = this.player.planeX * Math.cos(-rotSpeed) - this.player.planeY * Math.sin(-rotSpeed);
                this.player.planeY = oldPlaneX * Math.sin(-rotSpeed) + this.player.planeY * Math.cos(-rotSpeed);
            }
            
            if (keys['ArrowRight']) {
                // Rotate right
                const oldDirX = this.player.dirX;
                this.player.dirX = this.player.dirX * Math.cos(rotSpeed) - this.player.dirY * Math.sin(rotSpeed);
                this.player.dirY = oldDirX * Math.sin(rotSpeed) + this.player.dirY * Math.cos(rotSpeed);
                
                const oldPlaneX = this.player.planeX;
                this.player.planeX = this.player.planeX * Math.cos(rotSpeed) - this.player.planeY * Math.sin(rotSpeed);
                this.player.planeY = oldPlaneX * Math.sin(rotSpeed) + this.player.planeY * Math.cos(rotSpeed);
            }
            
            // Weapon switching
            if (key === '1') this.player.weapon = 0;
            if (key === '2') this.player.weapon = 1;
            if (key === '3') this.player.weapon = 2;
            if (key === '4') this.player.weapon = 3;
            
            e.preventDefault();
        });
        
        window.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });
    }
    
    // Raycasting renderer
    private render() {
        // Create image data
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;
        
        // Raycasting loop
        for (let x = 0; x < this.width; x++) {
            // Calculate ray position and direction
            const cameraX = 2 * x / this.width - 1;
            const rayDirX = this.player.dirX + this.player.planeX * cameraX;
            const rayDirY = this.player.dirY + this.player.planeY * cameraX;
            
            // Map position
            let mapX = Math.floor(this.player.x);
            let mapY = Math.floor(this.player.y);
            
            // Length of ray from current position to next side
            const deltaDistX = Math.abs(1 / rayDirX);
            const deltaDistY = Math.abs(1 / rayDirY);
            
            // Step direction and initial side distance
            let stepX: number;
            let stepY: number;
            let sideDistX: number;
            let sideDistY: number;
            
            if (rayDirX < 0) {
                stepX = -1;
                sideDistX = (this.player.x - mapX) * deltaDistX;
            } else {
                stepX = 1;
                sideDistX = (mapX + 1.0 - this.player.x) * deltaDistX;
            }
            
            if (rayDirY < 0) {
                stepY = -1;
                sideDistY = (this.player.y - mapY) * deltaDistY;
            } else {
                stepY = 1;
                sideDistY = (mapY + 1.0 - this.player.y) * deltaDistY;
            }
            
            // Perform DDA
            let hit = false;
            let side = 0;
            
            while (!hit) {
                if (sideDistX < sideDistY) {
                    sideDistX += deltaDistX;
                    mapX += stepX;
                    side = 0;
                } else {
                    sideDistY += deltaDistY;
                    mapY += stepY;
                    side = 1;
                }
                
                if (mapX >= 0 && mapX < this.mapWidth && mapY >= 0 && mapY < this.mapHeight) {
                    if (this.worldMap[mapY][mapX] > 0) hit = true;
                } else {
                    hit = true; // Hit boundary
                }
            }
            
            // Calculate distance to wall
            let perpWallDist: number;
            if (side === 0) {
                perpWallDist = (mapX - this.player.x + (1 - stepX) / 2) / rayDirX;
            } else {
                perpWallDist = (mapY - this.player.y + (1 - stepY) / 2) / rayDirY;
            }
            
            // Calculate line height
            const lineHeight = Math.floor(this.height / perpWallDist);
            
            // Calculate drawing limits
            let drawStart = -lineHeight / 2 + this.height / 2;
            if (drawStart < 0) drawStart = 0;
            let drawEnd = lineHeight / 2 + this.height / 2;
            if (drawEnd >= this.height) drawEnd = this.height - 1;
            
            // Get texture
            const texNum = this.worldMap[mapY][mapX] - 1;
            const texture = this.textures[texNum % this.textures.length];
            
            // Calculate texture X coordinate
            let wallX: number;
            if (side === 0) {
                wallX = this.player.y + perpWallDist * rayDirY;
            } else {
                wallX = this.player.x + perpWallDist * rayDirX;
            }
            wallX -= Math.floor(wallX);
            
            const texX = Math.floor(wallX * texture.width);
            
            // Draw the wall slice
            for (let y = drawStart; y < drawEnd; y++) {
                const d = y * 256 - this.height * 128 + lineHeight * 128;
                const texY = Math.floor((d * texture.height) / lineHeight / 256);
                
                if (texY >= 0 && texY < texture.height) {
                    let color = texture.pixels[texY * texture.width + texX];
                    
                    // Make sides darker
                    if (side === 1) {
                        // Darken y-sides
                        const r = ((color >> 16) & 0xFF) >> 1;
                        const g = ((color >> 8) & 0xFF) >> 1;
                        const b = (color & 0xFF) >> 1;
                        color = (r << 16) | (g << 8) | b;
                    }
                    
                    const pixelIndex = (y * this.width + x) * 4;
                    data[pixelIndex] = (color >> 16) & 0xFF;     // R
                    data[pixelIndex + 1] = (color >> 8) & 0xFF;  // G
                    data[pixelIndex + 2] = color & 0xFF;         // B
                    data[pixelIndex + 3] = 255;                   // A
                }
            }
            
            // Draw floor and ceiling
            for (let y = drawEnd + 1; y < this.height; y++) {
                // Floor
                const pixelIndex = (y * this.width + x) * 4;
                data[pixelIndex] = 0x40;      // R
                data[pixelIndex + 1] = 0x20;   // G
                data[pixelIndex + 2] = 0x10;   // B
                data[pixelIndex + 3] = 255;    // A
            }
            
            for (let y = 0; y < drawStart; y++) {
                // Ceiling
                const pixelIndex = (y * this.width + x) * 4;
                data[pixelIndex] = 0x20;       // R
                data[pixelIndex + 1] = 0x10;    // G
                data[pixelIndex + 2] = 0x08;    // B
                data[pixelIndex + 3] = 255;     // A
            }
        }
        
        // Draw the frame
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    private renderMinimap() {
        this.miniMapCtx.fillStyle = '#000';
        this.miniMapCtx.fillRect(0, 0, 200, 200);
        
        const cellSize = 6; // 200/32 ≈ 6.25, so 6 works
        
        // Draw map
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                if (this.worldMap[y][x] > 0) {
                    // Wall - different colors for different textures
                    const colors = ['#8B4513', '#808080', '#8B4513', '#4A4A4A', '#654321', '#8B0000'];
                    this.miniMapCtx.fillStyle = colors[(this.worldMap[y][x] - 1) % colors.length];
                    this.miniMapCtx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
                }
            }
        }
        
        // Draw player
        this.miniMapCtx.fillStyle = '#FF0000';
        this.miniMapCtx.beginPath();
        this.miniMapCtx.arc(
            this.player.x * cellSize,
            this.player.y * cellSize,
            3, 0, Math.PI * 2
        );
        this.miniMapCtx.fill();
        
        // Draw player direction
        this.miniMapCtx.strokeStyle = '#FFFF00';
        this.miniMapCtx.beginPath();
        this.miniMapCtx.moveTo(
            this.player.x * cellSize,
            this.player.y * cellSize
        );
        this.miniMapCtx.lineTo(
            (this.player.x + this.player.dirX * 2) * cellSize,
            (this.player.y + this.player.dirY * 2) * cellSize
        );
        this.miniMapCtx.stroke();
    }
    
    private updateDebug() {
        document.getElementById('fps')!.textContent = this.fps.toString();
        document.getElementById('pos')!.textContent = 
            `${this.player.x.toFixed(2)}, ${this.player.y.toFixed(2)}`;
        document.getElementById('angle')!.textContent = 
            (Math.atan2(this.player.dirY, this.player.dirX) * 180 / Math.PI).toFixed(1);
        
        document.getElementById('health')!.textContent = this.player.health + '%';
        document.getElementById('ammo')!.textContent = this.player.ammo.toString();
        
        const weapons = ['PISTOL', 'SHOTGUN', 'CHAINGUN', 'ROCKET'];
        document.getElementById('weapon')!.textContent = weapons[this.player.weapon];
    }
    
    private gameLoop = () => {
        // Render 3D view
        this.render();
        
        // Render minimap
        this.renderMinimap();
        
        // Update debug info
        this.updateDebug();
        
        // Calculate FPS
        this.frameCount++;
        const now = performance.now();
        const delta = now - this.lastTime;
        
        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            this.frameCount = 0;
            this.lastTime = now;
        }
        
        requestAnimationFrame(this.gameLoop);
    };
}

// Start the game when page loads
window.addEventListener('load', () => {
    new DoomEngine();
}); 