export interface FallMove {
    tileId: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}

export class FallStep {
    public readonly moves: FallMove[];

    constructor(moves: FallMove[]) {
        this.moves = moves.slice();
    }

    public isEmpty(): boolean {
        return this.moves.length === 0;
    }
}