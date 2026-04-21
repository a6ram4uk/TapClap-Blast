import { DestroyStep } from "./DestroyStep";
import { FallStep } from "./FallStep";

export class BoardActionResult {
    public readonly isValidAction: boolean;
    public readonly consumedMove: boolean;
    public readonly scoreGained: number;
    public readonly clickedTileId: number;
    public readonly groupSize: number;
    public readonly destroyStep: DestroyStep | null;
    public readonly fallStep: FallStep | null;
    public readonly steps: unknown[];

    constructor(
        isValidAction: boolean,
        consumedMove: boolean,
        scoreGained: number,
        clickedTileId: number,
        groupSize: number,
        destroyStep: DestroyStep | null,
        fallStep: FallStep | null,
        steps: unknown[] = []
    ) {
        this.isValidAction = isValidAction;
        this.consumedMove = consumedMove;
        this.scoreGained = scoreGained;
        this.clickedTileId = clickedTileId;
        this.groupSize = groupSize;
        this.destroyStep = destroyStep;
        this.fallStep = fallStep;
        this.steps = steps;
    }

    public static invalid(clickedTileId: number): BoardActionResult {
        return new BoardActionResult(
            false,
            false,
            0,
            clickedTileId,
            0,
            null,
            null,
            []
        );
    }

    public static validNormalClick(
        clickedTileId: number,
        groupSize: number,
        scoreGained: number,
        destroyStep: DestroyStep,
        fallStep: FallStep | null
    ): BoardActionResult {
        return new BoardActionResult(
            true,
            true,
            scoreGained,
            clickedTileId,
            groupSize,
            destroyStep,
            fallStep,
            []
        );
    }
}