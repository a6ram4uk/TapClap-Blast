import { SpawnSourceType } from "./SpawnSourceType";

export interface RefillSpawn {
    tileId: number;
    x: number;
    y: number;
    color: number;
    sourceType: SpawnSourceType;
}

export class RefillStep {
    public readonly spawns: RefillSpawn[];

    constructor(spawns: RefillSpawn[]) {
        this.spawns = spawns.slice();
    }

    public isEmpty(): boolean {
        return this.spawns.length === 0;
    }
}