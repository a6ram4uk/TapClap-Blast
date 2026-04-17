export class RefillSourceModel {
    private readonly _columnQueues: number[][];
    private readonly _randomTileTypes: number[];

    constructor(columnQueues: number[][], randomTileTypes: number[]) {
        this._columnQueues = columnQueues.map(queue => queue.slice());
        this._randomTileTypes = randomTileTypes.slice();
    }

    public getColumnCount(): number {
        return this._columnQueues.length;
    }

    public getRemainingQueueForColumn(column: number): number[] {
        return this._columnQueues[column].slice();
    }

    public getAllRemainingQueues(): number[][] {
        return this._columnQueues.map(queue => queue.slice());
    }

    public getRandomTileTypes(): number[] {
        return this._randomTileTypes.slice();
    }

    public hasPreparedTile(column: number): boolean {
        return this._columnQueues[column].length > 0;
    }

    public popPreparedTile(column: number): number | null {
        if (this._columnQueues[column].length === 0) {
            return null;
        }

        return this._columnQueues[column].shift() ?? null;
    }
}