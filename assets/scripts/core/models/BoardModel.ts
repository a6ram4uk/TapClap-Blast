import { TileData } from "./TileData";

export class BoardModel {
    private readonly _width: number;
    private readonly _height: number;
    private readonly _cells: Array<TileData | null>;

    constructor(width: number, height: number) {
        this._width = width;
        this._height = height;
        this._cells = new Array<TileData | null>(width * height).fill(null);
    }

    public getWidth(): number {
        return this._width;
    }

    public getHeight(): number {
        return this._height;
    }

    public isInside(x: number, y: number): boolean {
        return x >= 0 && x < this._width && y >= 0 && y < this._height;
    }

    public toIndex(x: number, y: number): number {
        return y * this._width + x;
    }

    public getTile(x: number, y: number): TileData | null {
        if (!this.isInside(x, y)) {
            return null;
        }

        return this._cells[this.toIndex(x, y)];
    }

    public setTile(x: number, y: number, tile: TileData | null): void {
        if (!this.isInside(x, y)) {
            throw new Error(`[BoardModel] setTile out of bounds: (${x}, ${y})`);
        }

        const index = this.toIndex(x, y);
        this._cells[index] = tile;

        if (tile !== null) {
            tile.x = x;
            tile.y = y;
        }
    }

    public forEachTile(callback: (tile: TileData | null, x: number, y: number) => void): void {
        for (let y = 0; y < this._height; y++) {
            for (let x = 0; x < this._width; x++) {
                callback(this.getTile(x, y), x, y);
            }
        }
    }
}