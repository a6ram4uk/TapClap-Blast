import { BoardActionResult } from "../../core/actions/BoardActionResult";
import { BoardGroupsModel } from "../../core/groups/BoardGroupsModel";
import { GroupFinder } from "../../core/groups/GroupFinder";
import { LevelsCatalogLoader } from "../../core/loaders/LevelsCatalogLoader";
import { LevelLoader } from "../../core/loaders/LevelLoader";
import { GameStatus } from "../../core/models/GameStatus";
import { BoardService } from "../../core/services/BoardService";
import { GameOutcomeResolver } from "../../core/services/GameOutcomeResolver";
import { LevelValidator } from "../../core/services/LevelValidator";
import { LevelSequenceResolver } from "../../core/services/LevelSequenceResolver";
import { LevelSessionFactory } from "../../core/services/LevelSessionFactory";
import { LevelSession } from "../../core/session/LevelSession";
import { BoardStepExecutor } from "../execution/BoardStepExecutor";
import BoardView from "../views/BoardView";
import GameResultView from "../views/GameResultView";
import GameHudView from "../views/GameHudView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameEntry extends cc.Component {
    @property(BoardView)
    public boardView: BoardView = null!;

    @property(GameResultView)
    public gameResultView: GameResultView = null!;

    @property(GameHudView)
    public gameHudView: GameHudView = null!;

    private readonly _validator: LevelValidator = new LevelValidator();
    private readonly _catalogLoader: LevelsCatalogLoader = new LevelsCatalogLoader(this._validator);
    private readonly _levelLoader: LevelLoader = new LevelLoader(this._validator);
    private readonly _levelSequenceResolver: LevelSequenceResolver = new LevelSequenceResolver();
    private readonly _sessionFactory: LevelSessionFactory = new LevelSessionFactory();
    private readonly _groupFinder: GroupFinder = new GroupFinder();
    private readonly _boardService: BoardService = new BoardService();
    private readonly _gameOutcomeResolver: GameOutcomeResolver = new GameOutcomeResolver();

    private _session: LevelSession | null = null;
    private _stepExecutor: BoardStepExecutor | null = null;
    private _isBusy: boolean = false;
    private _isLevelFinished: boolean = false;

    protected async start(): Promise<void> {
        try {
            await this.bootstrap();
        } catch (error) {
            cc.error("[GameEntry] Bootstrap failed:", error);
        }
    }

    private async bootstrap(): Promise<void> {
        this._isBusy = false;
        this._isLevelFinished = false;

        if (this.gameResultView) {
            this.gameResultView.hide();
        }

        const completedLevelsCount = 0;

        const catalog = await this._catalogLoader.loadCatalog();
        const currentLevelId = this._levelSequenceResolver.resolveCurrentLevelId(
            catalog,
            completedLevelsCount
        );

        const levelData = await this._levelLoader.loadLevel(currentLevelId);
        this._session = this._sessionFactory.createFromLevelData(levelData);

        this.rebuildBoardGroupsModel();

        this.boardView.setTileClickHandler(this.onTileClicked.bind(this));
        this.boardView.render(this._session.getBoardModel());

        this._stepExecutor = new BoardStepExecutor(
            this._boardService,
            this.boardView
        );

        cc.log(`[GameEntry] Loaded level: ${this._session.getLevelId()}`);

        this.logGroupsSummary();
        this.resolveAndHandleGameStatus();

        this.gameHudView.updateHud(this._session.getGameStateModel());
    }

    private async onTileClicked(tileId: number): Promise<void> {
        if (this._isBusy || this._isLevelFinished) {
            return;
        }

        if (!this._session || !this._stepExecutor) {
            return;
        }

        if (this._session.getGameStateModel().status !== GameStatus.Playing) {
            return;
        }

        const result = this._boardService.resolveClick(this._session, tileId);

        if (!result.isValidAction) {
            cc.log(`[Click] invalid tileId=${tileId}`);
            this.boardView.playInvalidClick(tileId);
            return;
        }

        this._isBusy = true;

        try {
            this.applyActionResult(result);

            await this._stepExecutor.execute(this._session, result);

            this.rebuildBoardGroupsModel();
            this.resolveAndHandleGameStatus();

            this.gameHudView.updateHud(this._session.getGameStateModel());

            this.logActionResult(tileId, result);
            this.logGroupsSummary();
        } catch (error) {
            cc.error("[GameEntry] Failed to resolve click:", error);
        } finally {
            this._isBusy = false;
        }
    }

    private applyActionResult(result: BoardActionResult): void {
        if (!this._session) {
            return;
        }

        if (!result.isValidAction) {
            return;
        }

        const gameStateModel = this._session.getGameStateModel();

        if (result.consumedMove) {
            gameStateModel.movesLeft -= 1;
        }

        gameStateModel.score += result.scoreGained;
    }

    private resolveAndHandleGameStatus(): void {
        if (!this._session) {
            return;
        }

        const gameState = this._session.getGameStateModel();
        gameState.status = this._gameOutcomeResolver.resolveStatus(this._session);

        if (gameState.status === GameStatus.Playing) {
            return;
        }

        this.handleLevelFinished(gameState.status);
    }

    private handleLevelFinished(status: GameStatus): void {
        if (!this._session) {
            return;
        }

        if (this._isLevelFinished) {
            return;
        }

        this._isLevelFinished = true;

        const gameState = this._session.getGameStateModel();

        cc.log(
            `[GameEntry] Level finished. status=${status}, score=${gameState.score}, target=${gameState.targetScore}, movesLeft=${gameState.movesLeft}`
        );

        if (this.gameResultView) {
            this.gameResultView.show(status);
        }
    }

    private rebuildBoardGroupsModel(): void {
        if (!this._session) {
            return;
        }

        const boardModel = this._session.getBoardModel();
        const groups = this._groupFinder.findAllGroups(boardModel);

        this._session.setBoardGroupsModel(
            new BoardGroupsModel(groups, boardModel.getWidth())
        );
    }

    private logActionResult(tileId: number, result: BoardActionResult): void {
        if (!this._session) {
            return;
        }

        const destroyStepSizes = result.destroySteps
            .map(step => step.tileIds.length)
            .join(" / ");

        const boosterCreates = result.boosterCreateStep
            ? result.boosterCreateStep.boosters.length
            : 0;

        const fallMoves = result.fallStep ? result.fallStep.moves.length : 0;
        const refillSpawns = result.refillStep ? result.refillStep.spawns.length : 0;

        const gameState = this._session.getGameStateModel();

        cc.log(
            `[Click] valid tileId=${tileId}, groupSize=${result.groupSize}, scoreGained=${result.scoreGained}, destroyWaves=[${destroyStepSizes}], boosterCreates=${boosterCreates}, fallMoves=${fallMoves}, refillSpawns=${refillSpawns}, movesLeft=${gameState.movesLeft}, score=${gameState.score}, status=${gameState.status}`
        );
    }

    private logGroupsSummary(): void {
        if (!this._session) {
            return;
        }

        const boardGroupsModel = this._session.getBoardGroupsModel();
        if (!boardGroupsModel) {
            return;
        }

        const groups = boardGroupsModel.getAllGroups();
        cc.log(`[Groups] total groups: ${groups.length}`);
        cc.log("[Groups] sizes:", groups.map(g => g.tiles.length).join(", "));
    }
}