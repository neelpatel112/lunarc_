export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Wall {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface MapData {
    walls: Wall[];
    pellets: Position[];
    powerPellets: Position[];
    width: number;
    height: number;
    cellSize: number;
}