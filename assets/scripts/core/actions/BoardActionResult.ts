import { BoosterCreateStep } from "./BoosterCreateStep";
import { DestroyStep } from "./DestroyStep";
import { FallStep } from "./FallStep";
import { RefillStep } from "./RefillStep";

export class BoardActionResult {
    public readonly isValidAction: boolean;
    public readonly consumedMove: boolean;
    public readonly scoreGained: number;
    public readonly clickedTileId: number;
    public readonly groupSize: number;
    public readonly destroyStep: DestroyStep | null;
    public readonly boosterCreateStep: BoosterCreateStep | null;
    public readonly fallStep: FallStep | null;
    public readonly refillStep: RefillStep | null;
    public readonly steps: unknown[];

    constructor(
        isValidAction: boolean,
        consumedMove: boolean,
        scoreGained: number,
        clickedTileId: number,
        groupSize: number,
        destroyStep: DestroyStep | null,
        boosterCreateStep: BoosterCreateStep | null,
        fallStep: FallStep | null,
        refillStep: RefillStep | null,
        steps: unknown[] = []
    ) {
        this.isValidAction = isValidAction;
        this.consumedMove = consumedMove;
        this.scoreGained = scoreGained;
        this.clickedTileId = clickedTileId;
        this.groupSize = groupSize;
        this.destroyStep = destroyStep;
        this.boosterCreateStep = boosterCreateStep;
        this.fallStep = fallStep;
        this.refillStep = refillStep;
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
        boosterCreateStep: BoosterCreateStep | null,
        fallStep: FallStep | null,
        refillStep: RefillStep | null
    ): BoardActionResult {
        return new BoardActionResult(
            true,
            true,
            scoreGained,
            clickedTileId,
            groupSize,
            destroyStep,
            boosterCreateStep,
            fallStep,
            refillStep,
            []
        );
    }
}