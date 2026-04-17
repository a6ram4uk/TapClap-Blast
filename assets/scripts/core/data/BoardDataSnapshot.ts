export interface BoardDataSnapshot {
    levelId: string;

    boardWidth: number;
    boardHeight: number;

    /**
     * Runtime board snapshot encoded as integer tile codes.
     * 0 = empty
     * other values are resolved through TileCodeMapper
     */
    boardCells: number[];

    /**
     * Remaining refill queues per column.
     * Each inner array is ordered from nearest-to-board to farthest.
     */
    refillQueues: number[][];

    score: number;
    movesLeft: number;
    targetScore: number;
}