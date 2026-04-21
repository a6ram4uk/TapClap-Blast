export class BoardActionResult {
    public readonly isValidAction: boolean;
    public readonly consumedMove: boolean;
    public readonly scoreGained: number;
    public readonly clickedTileId: number;
    public readonly groupSize: number;
    public readonly steps: unknown[];

    constructor(
        isValidAction: boolean,
        consumedMove: boolean,
        scoreGained: number,
        clickedTileId: number,
        groupSize: number,
        steps: unknown[] = []
    ) {
        this.isValidAction = isValidAction;
        this.consumedMove = consumedMove;
        this.scoreGained = scoreGained;
        this.clickedTileId = clickedTileId;
        this.groupSize = groupSize;
        this.steps = steps;
    }

    public static invalid(clickedTileId: number): BoardActionResult {
        return new BoardActionResult(
            false,
            false,
            0,
            clickedTileId,
            0,
            []
        );
    }

    public static validNormalClick(
        clickedTileId: number,
        groupSize: number,
        scoreGained: number
    ): BoardActionResult {
        return new BoardActionResult(
            true,
            true,
            scoreGained,
            clickedTileId,
            groupSize,
            []
        );
    }
}