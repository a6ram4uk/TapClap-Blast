export class RefillSourceModel {
    private readonly _refillQueues: number[][];
    private readonly _randomTileTypes: number[];

    constructor(refillQueues: number[][], randomTileTypes: number[]) {
        this._refillQueues = refillQueues.map(queue => queue.slice());
        this._randomTileTypes = randomTileTypes.slice();
    }

    public popPreparedTile(column: number): number | null {
        const queue = this._refillQueues[column];

        if (!queue || queue.length === 0) {
            return null;
        }

        return queue.shift()!;
    }

    public getRandomTileTypes(): number[] {
        return this._randomTileTypes.slice();
    }

    public createQueuesSnapshot(): number[][] {
        return this._refillQueues.map(queue => queue.slice());
    }
}