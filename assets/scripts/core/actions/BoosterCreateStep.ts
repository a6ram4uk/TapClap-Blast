import { TileType } from "../models/TileType";

export interface BoosterCreateInfo {
    tileId: number;
    x: number;
    y: number;
    type: TileType;
    color: number | null;
}

export class BoosterCreateStep {
    public readonly boosters: BoosterCreateInfo[];

    constructor(boosters: BoosterCreateInfo[]) {
        this.boosters = boosters.slice();
    }

    public isEmpty(): boolean {
        return this.boosters.length === 0;
    }
}