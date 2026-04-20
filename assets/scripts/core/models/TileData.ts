import { TileType } from "./TileType";

export class TileData {
    public readonly tileId: number;

    public x: number;
    public y: number;

    public type: TileType;
    public color: number | null;

    constructor(
        tileId: number,
        x: number,
        y: number,
        type: TileType,
        color: number | null
    ) {
        this.tileId = tileId;
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
    }
}