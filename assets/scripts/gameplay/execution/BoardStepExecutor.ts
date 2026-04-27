import { BoardActionResult } from "../../core/actions/BoardActionResult";
import { BoardService } from "../../core/services/BoardService";
import { LevelSession } from "../../core/session/LevelSession";
import BoardView from "../views/BoardView";

export class BoardStepExecutor {
    private readonly _boardService: BoardService;
    private readonly _boardView: BoardView;

    constructor(boardService: BoardService, boardView: BoardView) {
        this._boardService = boardService;
        this._boardView = boardView;
    }

    public async execute(session: LevelSession, result: BoardActionResult): Promise<void> {
        for (const destroyStep of result.destroySteps) {
            await this._boardView.animateDestroy(destroyStep.tileIds);

            this._boardService.applyDestroyStep(session, destroyStep);
            this._boardView.removeTileViews(destroyStep.tileIds);
        }

        if (result.boosterCreateStep) {
            this._boardService.applyBoosterCreateStep(session, result.boosterCreateStep);
            this._boardView.createBoosterViews(result.boosterCreateStep.boosters);

            const boosterIds = result.boosterCreateStep.boosters.map(booster => booster.tileId);
            await this._boardView.animateBoosterCreate(boosterIds);
        }

        if (result.fallStep) {
            await this._boardView.animateFall(result.fallStep.moves);

            this._boardService.applyFallStep(session, result.fallStep);
        }

        if (result.refillStep) {
            this._boardService.applyRefillStep(session, result.refillStep);
            this._boardView.createRefillViews(result.refillStep.spawns);

            await this._boardView.animateRefill(result.refillStep.spawns);
        }

        this._boardView.refreshTileDrawOrder();
    }
}