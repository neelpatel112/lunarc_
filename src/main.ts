// src/main.ts - Authentic DOOM Style

interface Player {
    x: number;
    y: number;
    dirX: number;
    dirY: number;
    planeX: number;
    planeY: number;
    health: number;
    armor: number;
    ammo: number;
    weapon: number;
    frags: number;
    keys: {
        blue: boolean;
        yellow: boolean;
        red: boolean;
    };
}

interface Texture {
    width: number;
    height: number;
    pixels: Uint32Array;
}

class DoomEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private automapCanvas: HTMLCanvasElement;
    private automapCtx: CanvasRenderingContext2D;
    
    // Screen dimensions (DOOM resolution)
    private readonly width = 960;
    private readonly height = 720;
    
    // Player
    private player: Player;
    
    // Map - Classic DOOM E1M1 style
    private readonly mapWidth = 32;
    private readonly mapHeight = 32;
    private worldMap: number[][];
    
    // Textures
    private textures: Texture[] = [];
    private readonly texWidth = 64;
    private readonly texHeight = 64;
    
    // Game state
    private automapVisible = false;
    private weaponBob = 0;
    private frame = 0;
    private lastShot = 0;
    
    // DOOM palette colors
    private readonly floorColors = [0x402010, 0x4a2a1a, 0x351a0e];
    private readonly ceilingColors = [0x201010, 0x251515, 0x1a0e0e];
    
    // Face states
    private readonly faces = ['😐', '😮', '😲', '😫', '💀'];
    private currentFace = 0;
    
    constructor() {
        this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d', { alpha: false })!;
        this.automapCanvas = document.getElementById('automap') as HTMLCanvasElement;
        this.automapCtx = this.automapCanvas.getContext('2d')!;
        
        // Initialize player with DOOM stats
        this.player = {
            x: 15.5,
            y: 15.5,
            dirX: -1,
            dirY: 0,
            planeX: 0,
            planeY: 0.66,
            health: 100,
            armor: 100,
            ammo: 50,
            weapon: 0,
            frags: 0,
            keys: { blue: false, yellow: false, red: false }
        };
        
        // Create DOOM-style map
        this.worldMap = this.createDoomMap();
        
        // Generate DOOM textures
        this.generateTextures();
        
        // Initialize game
        this.init();
    }
    
    // Create E1M1-style map
    private createDoomMap(): number[][] {
        const map: number[][] = [];
        
        // Initialize with 0
        for (let y = 0; y < this.mapHeight; y++) {
            map[y] = new Array(this.mapWidth).fill(0);
        }
        
        // Outer walls
        for (let x = 0; x < this.mapWidth; x++) {
            map[0][x] = 1;
            map[this.mapHeight-1][x] = 1;
        }
        for (let y = 0; y < this.mapHeight; y++) {
            map[y][0] = 1;
            map[y][this.mapWidth-1] = 1;
        }
        
        // E1M1 style layout (Tech Base)
        // Main hall
        for (let y = 5; y < 10; y++) {
            for (let x = 5; x < 20; x++) {
                if (x % 3 === 0 && y % 3 === 0) {
                    map[y][x] = 2; // Pillars
                }
            }
        }
        
        // Side rooms
        // Room 1 (Blue key room)
        for (let y = 15; y < 22; y++) {
            for (let x = 5; x < 12; x++) {
                if (Math.random() > 0.3) {
                    map[y][x] = 3; // Computer textures
                }
            }
        }
        
        // Room 2 (Yellow key room)
        for (let y = 15; y < 22; y++) {
            for (let x = 18; x < 25; x++) {
                if (Math.random() > 0.3) {
                    map[y][x] = 4; // Metal textures
                }
            }
        }
        
        // Secret area
        map[25][25] = 5; // Secret door
        for (let y = 22; y < 28; y++) {
            for (let x = 22; x < 28; x++) {
                if (y > 23 && x > 23) {
                    map[y][x] = 6; // Marble (secret area)
                }
            }
        }
        
        // Corridors
        for (let i = 10; i < 22; i++) {
            map[i][12] = 1;
            map[i][17] = 1;
        }
        
        // Add some random decorations
        for (let i = 0; i < 20; i++) {
            const x = Math.floor(Math.random() * 28) + 2;
            const y = Math.floor(Math.random() * 28) + 2;
            if (map[y][x] === 0) {
                map[y][x] = Math.floor(Math.random() * 4) + 1;
            }
        }
        
        return map;
    }
    
    // Generate DOOM-style textures
    private generateTextures() {
        const textures = [
            this.createBrickTexture,      // 0: BRICK
            this.createStoneTexture,       // 1: STONE
            this.createComputerTexture,    // 2: COMPUTER
            this.createMetalTexture,       // 3: METAL
            this.createWoodTexture,        // 4: WOOD
            this.createMarbleTexture,      // 5: MARBLE
            this.createDoorTexture,        // 6: DOOR
            this.createBloodTexture        // 7: BLOOD
        ];
        
        textures.forEach((createFunc, index) => {
            this.textures.push({
                width: this.texWidth,
                height: this.texHeight,
                pixels: createFunc.call(this)
            });
        });
    }
    
    private createBrickTexture(): Uint32Array {
        const pixels = new Uint32Array(this.texWidth * this.texHeight);
        for (let y = 0; y < this.texHeight; y++) {
            for (let x = 0; x < this.texWidth; x++) {
                const brickRow = Math.floor(y / 16);
                const brickCol = Math.floor(x / 32);
                const inBrick = (brickRow + brickCol) % 2 === 0;
                pixels[y * this.texWidth + x] = inBrick ? 0x8B4513 : 0x5D3A1A;
            }
        }
        return pixels;
    }
    
    private createStoneTexture(): Uint32Array {
        const pixels = new Uint32Array(this.texWidth * this.texHeight);
        for (let y = 0; y < this.texHeight; y++) {
            for (let x = 0; x < this.texWidth; x++) {
                const noise = (Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.2 + 0.8) * 255;
                pixels[y * this.texWidth + x] = (noise << 16) | (noise << 8) | noise;
            }
        }
        return pixels;
    }
    
    private createComputerTexture(): Uint32Array {
        const pixels = new Uint32Array(this.texWidth * this.texHeight);
        for (let y = 0; y < this.texHeight; y++) {
            for (let x = 0; x < this.texWidth; x++) {
                if (x % 16 < 8 && y % 16 < 8) {
                    pixels[y * this.texWidth + x] = 0x00FF00; // Green screen
                } else if (x % 8 === 0 || y % 8 === 0) {
                    pixels[y * this.texWidth + x] = 0x4A4A4A; // Metal border
                } else {
                    pixels[y * this.texWidth + x] = 0x2A2A2A; // Dark metal
                }
            }
        }
        return pixels;
    }
    
    private createMetalTexture(): Uint32Array {
        const pixels = new Uint32Array(this.texWidth * this.texHeight);
        for (let y = 0; y < this.texHeight; y++) {
            for (let x = 0; x < this.texWidth; x++) {
                const rivet = (x % 16 === 8 && y % 16 === 8) ? 0xC0C0C0 : 0x808080;
                pixels[y * this.texWidth + x] = rivet;
            }
        }
        return pixels;
    }
    
    private createWoodTexture(): Uint32Array {
        const pixels = new Uint32Array(this.texWidth * this.texHeight);
        for (let y = 0; y < this.texHeight; y++) {
            for (let x = 0; x < this.texWidth; x++) {
                const grain = Math.sin(y * 0.2) * 0x20 + 0x60;
                pixels[y * this.texWidth + x] = (grain << 16) | (grain << 8) | grain;
            }
        }
        return pixels;
    }
    
    private createMarbleTexture(): Uint32Array {
        const pixels = new Uint32Array(this.texWidth * this.texHeight);
        for (let y = 0; y < this.texHeight; y++) {
            for (let x = 0; x < this.texWidth; x++) {
                const vein = Math.sin(x * 0.2) * Math.cos(y * 0.2) > 0.5 ? 0xE0E0E0 : 0xFFFFFF;
                pixels[y * this.texWidth + x] = vein;
            }
        }
        return pixels;
    }
    
    private createDoorTexture(): Uint32Array {
        const pixels = new Uint32Array(this.texWidth * this.texHeight);
        for (let y = 0; y < this.texHeight; y++) {
            for (let x = 0; x < this.texWidth; x++) {
                const isHandle = (x > 25 && x < 35 && y > 30 && y < 35);
                pixels[y * this.texWidth + x] = isHandle ? 0xFFD700 : 0x8B4513;
            }
        }
        return pixels;
    }
    
    private createBloodTexture(): Uint32Array {
        const pixels = new Uint32Array(this.texWidth * this.texHeight);
        for (let y = 0; y < this.texHeight; y++) {
            for (let x = 0; x < this.texWidth; x++) {
                const blood = (Math.sin(x * 0.5) * Math.cos(y * 0.5) > 0.3) ? 0x8B0000 : 0x5A0000;
                pixels[y * this.texWidth + x] = blood;
            }
        }
        return pixels;
    }
    
    private init() {
        this.setupInput();
        this.setupUI();
        this.gameLoop();
    }
    
    private setupUI() {
        // Weapon selection
        document.querySelectorAll('.weapon-slot').forEach((slot, index) => {
            slot.addEventListener('click', () => {
                this.player.weapon = index;
                this.updateWeaponUI(index);
            });
        });
    }
    
    private updateWeaponUI(activeWeapon: number) {
        document.querySelectorAll('.weapon-slot').forEach((slot, index) => {
            if (index === activeWeapon) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }
        });
    }
    
    private setupInput() {
        const keys: { [key: string]: boolean } = {};
        
        window.addEventListener('keydown', (e) => {
            const key = e.key;
            keys[key] = true;
            
            const moveSpeed = 0.05;
            const rotSpeed = 0.03;
            
            // Movement
            if (keys['w'] || keys['W']) {
                const newX = this.player.x + this.player.dirX * moveSpeed;
                const newY = this.player.y + this.player.dirY * moveSpeed;
                
                if (this.worldMap[Math.floor(this.player.y)][Math.floor(newX)] === 0) {
                    this.player.x = newX;
                }
                if (this.worldMap[Math.floor(newY)][Math.floor(this.player.x)] === 0) {
                    this.player.y = newY;
                }
                
                // Weapon bob
                this.weaponBob = Math.sin(this.frame * 0.2) * 5;
            }
            
            if (keys['s'] || keys['S']) {
                const newX = this.player.x - this.player.dirX * moveSpeed;
                const newY = this.player.y - this.player.dirY * moveSpeed;
                
                if (this.worldMap[Math.floor(this.player.y)][Math.floor(newX)] === 0) {
                    this.player.x = newX;
                }
                if (this.worldMap[Math.floor(newY)][Math.floor(this.player.x)] === 0) {
                    this.player.y = newY;
                }
            }
            
            if (keys['a'] || keys['A']) {
                const strafeX = -this.player.dirY * moveSpeed;
                const strafeY = this.player.dirX * moveSpeed;
                
                if (this.worldMap[Math.floor(this.player.y)][Math.floor(this.player.x + strafeX)] === 0) {
                    this.player.x += strafeX;
                }
                if (this.worldMap[Math.floor(this.player.y + strafeY)][Math.floor(this.player.x)] === 0) {
                    this.player.y += strafeY;
                }
            }
            
            if (keys['d'] || keys['D']) {
                const strafeX = this.player.dirY * moveSpeed;
                const strafeY = -this.player.dirX * moveSpeed;
                
                if (this.worldMap[Math.floor(this.player.y)][Math.floor(this.player.x + strafeX)] === 0) {
                    this.player.x += strafeX;
                }
                if (this.worldMap[Math.floor(this.player.y + strafeY)][Math.floor(this.player.x)] === 0) {
                    this.player.y += strafeY;
                }
            }
            
            // Rotation
            if (keys['ArrowLeft']) {
                const oldDirX = this.player.dirX;
                this.player.dirX = this.player.dirX * Math.cos(-rotSpeed) - this.player.dirY * Math.sin(-rotSpeed);
                this.player.dirY = oldDirX * Math.sin(-rotSpeed) + this.player.dirY * Math.cos(-rotSpeed);
                
                const oldPlaneX = this.player.planeX;
                this.player.planeX = this.player.planeX * Math.cos(-rotSpeed) - this.player.planeY * Math.sin(-rotSpeed);
                this.player.planeY = oldPlaneX * Math.sin(-rotSpeed) + this.player.planeY * Math.cos(-rotSpeed);
            }
            
            if (keys['ArrowRight']) {
                const oldDirX = this.player.dirX;
                this.player.dirX = this.player.dirX * Math.cos(rotSpeed) - this.player.dirY * Math.sin(rotSpeed);
                this.player.dirY = oldDirX * Math.sin(rotSpeed) + this.player.dirY * Math.cos(rotSpeed);
                
                const oldPlaneX = this.player.planeX;
                this.player.planeX = this.player.planeX * Math.cos(rotSpeed) - this.player.planeY * Math.sin(rotSpeed);
                this.player.planeY = oldPlaneX * Math.sin(rotSpeed) + this.player.planeY * Math.cos(rotSpeed);
            }
            
            // Tab for automap
            if (key === 'Tab') {
                this.automapVisible = !this.automapVisible;
                this.automapCanvas.style.display = this.automapVisible ? 'block' : 'none';
                e.preventDefault();
            }
            
            // Weapon switching
            if (key === '1') this.player.weapon = 0;
            if (key === '2') this.player.weapon = 1;
            if (key === '3') this.player.weapon = 2;
            if (key === '4') this.player.weapon = 3;
            
            // Fire with Ctrl
            if (key === 'Control') {
                this.fire();
            }
            
            this.updateWeaponUI(this.player.weapon);
            e.preventDefault();
        });
        
        window.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });
    }
    
    private fire() {
        const now = Date.now();
        if (now - this.lastShot > 200 && this.player.ammo > 0) {
            this.player.ammo--;
            this.player.frags++;
            this.lastShot = now;
            
            // Face reaction
            this.currentFace = 2; // Surprised face
            setTimeout(() => {
                this.currentFace = this.player.health > 50 ? 0 : 3;
            }, 200);
        }
    }
    
    private render() {
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;
        
        // Raycasting
        for (let x = 0; x < this.width; x++) {
            const cameraX = 2 * x / this.width - 1;
            const rayDirX = this.player.dirX + this.player.planeX * cameraX;
            const rayDirY = this.player.dirY + this.player.planeY * cameraX;
            
            let mapX = Math.floor(this.player.x);
            let mapY = Math.floor(this.player.y);
            
            const deltaDistX = Math.abs(1 / rayDirX);
            const deltaDistY = Math.abs(1 / rayDirY);
            
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
                    hit = true;
                }
            }
            
            let perpWallDist: number;
            if (side === 0) {
                perpWallDist = (mapX - this.player.x + (1 - stepX) / 2) / rayDirX;
            } else {
                perpWallDist = (mapY - this.player.y + (1 - stepY) / 2) / rayDirY;
            }
            
            const lineHeight = Math.floor(this.height / perpWallDist);
            
            let drawStart = -lineHeight / 2 + this.height / 2;
            if (drawStart < 0) drawStart = 0;
            let drawEnd = lineHeight / 2 + this.height / 2;
            if (drawEnd >= this.height) drawEnd = this.height - 1;
            
            const texNum = this.worldMap[mapY][mapX] - 1;
            const texture = this.textures[texNum % this.textures.length];
            
            let wallX: number;
            if (side === 0) {
                wallX = this.player.y + perpWallDist * rayDirY;
            } else {
                wallX = this.player.x + perpWallDist * rayDirX;
            }
            wallX -= Math.floor(wallX);
            
            const texX = Math.floor(wallX * texture.width);
            
            // Draw wall
            for (let y = drawStart; y < drawEnd; y++) {
                const d = y * 256 - this.height * 128 + lineHeight * 128;
                const texY = Math.floor((d * texture.height) / lineHeight / 256);
                
                if (texY >= 0 && texY < texture.height) {
                    let color = texture.pixels[texY * texture.width + texX];
                    
                    if (side === 1) {
                        // Darken y-sides
                        const r = ((color >> 16) & 0xFF) >> 1;
                        const g = ((color >> 8) & 0xFF) >> 1;
                        const b = (color & 0xFF) >> 1;
                        color = (r << 16) | (g << 8) | b;
                    }
                    
                    const pixelIndex = (y * this.width + x) * 4;
                    data[pixelIndex] = (color >> 16) & 0xFF;
                    data[pixelIndex + 1] = (color >> 8) & 0xFF;
                    data[pixelIndex + 2] = color & 0xFF;
                    data[pixelIndex + 3] = 255;
                }
            }
            
            // Draw floor and ceiling with DOOM colors
            const floorColor = this.floorColors[Math.floor(Math.random() * this.floorColors.length)];
            const ceilingColor = this.ceilingColors[Math.floor(Math.random() * this.ceilingColors.length)];
            
            for (let y = drawEnd + 1; y < this.height; y++) {
                const pixelIndex = (y * this.width + x) * 4;
                data[pixelIndex] = (floorColor >> 16) & 0xFF;
                data[pixelIndex + 1] = (floorColor >> 8) & 0xFF;
                data[pixelIndex + 2] = floorColor & 0xFF;
                data[pixelIndex + 3] = 255;
            }
            
            for (let y = 0; y < drawStart; y++) {
                const pixelIndex = (y * this.width + x) * 4;
                data[pixelIndex] = (ceilingColor >> 16) & 0xFF;
                data[pixelIndex + 1] = (ceilingColor >> 8) & 0xFF;
                data[pixelIndex + 2] = ceilingColor & 0xFF;
                data[pixelIndex + 3] = 255;
            }
        }
        
        // Draw weapon sprite (DOOM style)
        if (this.player.weapon === 0) { // Pistol
            const weaponWidth = 200;
            const weaponHeight = 200;
            const weaponX = (this.width - weaponWidth) / 2 + 50;
            const weaponY = this.height - weaponHeight + 20 + this.weaponBob;
            
            for (let wy = 0; wy < weaponHeight; wy++) {
                for (let wx = 0; wx < weaponWidth; wx++) {
                    const screenX = weaponX + wx;
                    const screenY = weaponY + wy;
                    
                    if (screenX >= 0 && screenX < this.width && screenY >= 0 && screenY < this.height) {
                        if (wx > 80 && wx < 120 && wy > 150) {
                            const pixelIndex = (screenY * this.width + screenX) * 4;
                            data[pixelIndex] = 0x44;
                            data[pixelIndex + 1] = 0x44;
                            data[pixelIndex + 2] = 0x44;
                            data[pixelIndex + 3] = 255;
                        }
                    }
                }
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    private renderAutomap() {
        this.automapCtx.fillStyle = '#000';
        this.automapCtx.fillRect(0, 0, 200, 200);
        
        const cellSize = 6;
        
        // Draw walls (red like DOOM automap)
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                if (this.worldMap[y][x] > 0) {
                    this.automapCtx.fillStyle = '#FF0000';
                    this.automapCtx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
                }
            }
        }
        
        // Draw player (yellow arrow)
        this.automapCtx.fillStyle = '#FFFF00';
        this.automapCtx.beginPath();
        this.automapCtx.arc(
            this.player.x * cellSize,
            this.player.y * cellSize,
            2, 0, Math.PI * 2
        );
        this.automapCtx.fill();
        
        // Draw direction line
        this.automapCtx.strokeStyle = '#FFFF00';
        this.automapCtx.beginPath();
        this.automapCtx.moveTo(
            this.player.x * cellSize,
            this.player.y * cellSize
        );
        this.automapCtx.lineTo(
            (this.player.x + this.player.dirX * 3) * cellSize,
            (this.player.y + this.player.dirY * 3) * cellSize
        );
        this.automapCtx.stroke();
    }
    
    private updateHUD() {
        // Update health
        const healthPercent = Math.max(0, this.player.health);
        document.getElementById('health-fill')!.style.width = healthPercent + '%';
        document.getElementById('health-value')!.textContent = healthPercent + '%';
        
        // Update armor
        document.getElementById('armor-value')!.textContent = this.player.armor.toString();
        
        // Update ammo
        document.getElementById('ammo-value')!.textContent = this.player.ammo.toString();
        
        // Update frags
        document.getElementById('frags')!.textContent = `KILLS: ${this.player.frags}`;
        
        // Update face based on health
        if (this.player.health <= 0) {
            this.currentFace = 4; // Dead
        } else if (this.player.health < 20) {
            this.currentFace = 3; // Near death
        } else if (this.player.health < 50) {
            this.currentFace = 2; // Hurt
        } else if (this.player.health < 80) {
            this.currentFace = 1; // Slight hurt
        } else {
            this.currentFace = 0; // Normal
        }
        
        document.getElementById('face-box')!.textContent = this.faces[this.currentFace];
        
        // Update keys
        document.getElementById('key-blue')!.style.opacity = this.player.keys.blue ? '1' : '0.3';
        document.getElementById('key-yellow')!.style.opacity = this.player.keys.yellow ? '1' : '0.3';
        document.getElementById('key-red')!.style.opacity = this.player.keys.red ? '1' : '0.3';
    }
    
    private gameLoop = () => {
        this.frame++;
        this.render();
        this.renderAutomap();
        this.updateHUD();
        requestAnimationFrame(this.gameLoop);
    };
}

// Start the game
window.addEventListener('load', () => {
    new DoomEngine();
});