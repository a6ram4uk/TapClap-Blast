import { BoardActionResult } from "../../core/actions/BoardActionResult";
import { BoosterInventoryModel } from "../../core/boosters/BoosterInventoryModel";
import { BoosterType } from "../../core/boosters/BoosterType";
import { BoardGroupsModel } from "../../core/groups/BoardGroupsModel";
import { GroupFinder } from "../../core/groups/GroupFinder";
import { LevelsCatalogLoader } from "../../core/loaders/LevelsCatalogLoader";
import { LevelLoader } from "../../core/loaders/LevelLoader";
import { GameStatus } from "../../core/models/GameStatus";
import { BoardSnapshotFactory } from "../../core/progress/BoardSnapshotFactory";
import { ProgressSaveData } from "../../core/progress/ProgressSaveData";
import { ProgressStorage } from "../../core/progress/ProgressStorage";
import { BoardService } from "../../core/services/BoardService";
import { GameOutcomeResolver } from "../../core/services/GameOutcomeResolver";
import { LevelValidator } from "../../core/services/LevelValidator";
import { LevelSequenceResolver } from "../../core/services/LevelSequenceResolver";
import { LevelSessionFactory } from "../../core/services/LevelSessionFactory";
import { LevelSession } from "../../core/session/LevelSession";
import { BoardStepExecutor } from "../execution/BoardStepExecutor";
import { BoardSelectionController } from "../input/BoardSelectionController";
import BoardView from "../views/BoardView";
import BoosterBarView from "../views/BoosterBarView";
import GameHudView from "../views/GameHudView";
import GameResultView from "../views/GameResultView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameEntry extends cc.Component {
    @property(BoardView)
    public boardView: BoardView = null!;

    @property(GameHudView)
    public gameHudView: GameHudView = null!;

    @property(GameResultView)
    public gameResultView: GameResultView = null!;

    @property(BoosterBarView)
    public boosterBarView: BoosterBarView = null!;

    private readonly _validator: LevelValidator = new LevelValidator();
    private readonly _catalogLoader: LevelsCatalogLoader = new LevelsCatalogLoader(this._validator);
    private readonly _levelLoader: LevelLoader = new LevelLoader(this._validator);
    private readonly _levelSequenceResolver: LevelSequenceResolver = new LevelSequenceResolver();
    private readonly _sessionFactory: LevelSessionFactory = new LevelSessionFactory();
    private readonly _groupFinder: GroupFinder = new GroupFinder();
    private readonly _boardService: BoardService = new BoardService();
    private readonly _gameOutcomeResolver: GameOutcomeResolver = new GameOutcomeResolver();
    private readonly _progressStorage: ProgressStorage = new ProgressStorage();
    private readonly _boardSnapshotFactory: BoardSnapshotFactory = new BoardSnapshotFactory();
    private readonly _boardSelectionController: BoardSelectionController = new BoardSelectionController();

    private _session: LevelSession | null = null;
    private _stepExecutor: BoardStepExecutor | null = null;
    private _isBusy: boolean = false;
    private _isLevelFinished: boolean = false;

    private _progress: ProgressSaveData = this._progressStorage.load();

    private _boosterInventory: BoosterInventoryModel | null = null;
    private _selectedBoosterType: BoosterType | null = null;

    protected async start(): Promise<void> {
        try {
            this.setupResultHandlers();
            this.setupBoosterHandlers();

            await this.loadCurrentLevel();
        } catch (error) {
            cc.error("[GameEntry] Start failed:", error);
        }
    }

    private setupResultHandlers(): void {
        if (!this.gameResultView) {
            return;
        }

        this.gameResultView.setNextHandler(this.onNextLevelClicked.bind(this));
        this.gameResultView.setRestartHandler(this.onRestartClicked.bind(this));
    }

    private setupBoosterHandlers(): void {
        if (!this.boosterBarView) {
            return;
        }

        this.boosterBarView.setClickHandler(this.onBoosterButtonClicked.bind(this));
    }

    private async loadCurrentLevel(): Promise<void> {
        this._isBusy = false;
        this._isLevelFinished = false;

        this.cancelBoosterSelection();

        if (this.gameResultView) {
            this.gameResultView.hide();
        }

        this.ensureBoosterInventory();

        const catalog = await this._catalogLoader.loadCatalog();

        const levelId = this._progress.activeLevel
            ? this._progress.activeLevel.levelId
            : this._levelSequenceResolver.resolveCurrentLevelId(
                catalog,
                this._progress.completedLevelsCount
            );

        const levelData = await this._levelLoader.loadLevel(levelId);

        if (this._progress.activeLevel) {
            try {
                this._session = this._sessionFactory.createFromSaveData(
                    levelData,
                    this._progress.activeLevel
                );

                cc.log(`[GameEntry] Restored level from snapshot: ${levelId}`);
            } catch (error) {
                cc.warn("[GameEntry] Invalid snapshot. Starting level from scratch.", error);

                this._progress.activeLevel = null;
                this._progressStorage.save(this._progress);

                this._session = this._sessionFactory.createFromLevelData(levelData);
            }
        } else {
            this._session = this._sessionFactory.createFromLevelData(levelData);
        }

        this.rebuildBoardGroupsModel();

        this.boardView.setTileClickHandler(this.onTileClicked.bind(this));
        this.boardView.render(this._session.getBoardModel());
        this.boardView.refreshTileDrawOrder();

        this._stepExecutor = new BoardStepExecutor(
            this._boardService,
            this.boardView
        );

        this.resolveAndHandleGameStatus();
        this.updateHud();
        this.updateBoosterBar();

        cc.log(
            `[GameEntry] Loaded level: ${this._session.getLevelId()}, completed=${this._progress.completedLevelsCount}`
        );

        this.logGroupsSummary();
    }

    private async onNextLevelClicked(): Promise<void> {
        if (this._isBusy) {
            return;
        }

        await this.loadCurrentLevel();
    }

    private async onRestartClicked(): Promise<void> {
        if (this._isBusy) {
            return;
        }

        this._progress.activeLevel = null;
        this._progressStorage.save(this._progress);

        await this.loadCurrentLevel();
    }

    private async onTileClicked(tileId: number): Promise<void> {
        if (this._isBusy || this._isLevelFinished) {
            return;
        }

        if (!this._session || !this._stepExecutor) {
            return;
        }

        if (this._boardSelectionController.isSelecting()) {
            this._boardSelectionController.acceptTile(tileId);
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

        await this.executeActionResult(tileId, result);
    }

    private async onBoosterButtonClicked(type: BoosterType): Promise<void> {
        if (this._isBusy || this._isLevelFinished) {
            return;
        }

        if (!this._session || !this._stepExecutor) {
            return;
        }

        if (!this._boosterInventory || !this._boosterInventory.hasAny(type)) {
            cc.log(`[GameEntry] No boosters left: ${type}`);
            return;
        }

        if (this._boardSelectionController.isSelecting()) {
            this.cancelBoosterSelection();
            return;
        }

        this._selectedBoosterType = type;
        this.updateBoosterBar();

        const requiredSelectionCount = this.getBoosterRequiredSelectionCount(type);
        const selectedTileIds = await this._boardSelectionController.selectTiles(requiredSelectionCount);

        await this.useSelectedBooster(type, selectedTileIds);
    }

    private async useSelectedBooster(type: BoosterType, selectedTileIds: number[]): Promise<void> {
        if (!this._session || !this._stepExecutor || !this._boosterInventory) {
            return;
        }

        this._selectedBoosterType = null;
        this.updateBoosterBar();

        const result = this._boardService.resolveBoosterToolUse(
            this._session,
            type,
            selectedTileIds
        );

        if (!result.isValidAction) {
            cc.log(`[GameEntry] Invalid booster use: ${type}`);
            return;
        }

        this._boosterInventory.consume(type);
        this.syncBoosterInventoryToProgress();

        await this.executeActionResult(selectedTileIds[0], result);
    }

    private async executeActionResult(tileId: number, result: BoardActionResult): Promise<void> {
        if (!this._session || !this._stepExecutor) {
            return;
        }

        this._isBusy = true;

        try {
            this.applyActionResult(result);

            await this._stepExecutor.execute(this._session, result);

            this.rebuildBoardGroupsModel();
            this.resolveAndHandleGameStatus();
            this.updateHud();
            this.updateBoosterBar();

            this.saveProgressAfterResolvedMove();

            this.logActionResult(tileId, result);
            this.logGroupsSummary();
        } catch (error) {
            cc.error("[GameEntry] Failed to execute action result:", error);
        } finally {
            this._isBusy = false;
        }
    }

    private applyActionResult(result: BoardActionResult): void {
        if (!this._session || !result.isValidAction) {
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
        if (!this._session || this._isLevelFinished) {
            return;
        }

        this._isLevelFinished = true;
        this.cancelBoosterSelection();

        const gameState = this._session.getGameStateModel();

        cc.log(
            `[GameEntry] Level finished. status=${status}, score=${gameState.score}, target=${gameState.targetScore}, movesLeft=${gameState.movesLeft}`
        );

        if (status === GameStatus.Won) {
            this._progress.completedLevelsCount += 1;
            this._progress.activeLevel = null;
            this._progressStorage.save(this._progress);
        }

        if (status === GameStatus.Lost) {
            this._progress.activeLevel = null;
            this._progressStorage.save(this._progress);
        }

        if (this.gameResultView) {
            this.gameResultView.show(status);
        }
    }

    private ensureBoosterInventory(): void {
        if (this._boosterInventory) {
            return;
        }

        this._boosterInventory = new BoosterInventoryModel(
            this._progress.boosters.bomb,
            this._progress.boosters.teleport
        );
    }

    private updateBoosterBar(): void {
        if (!this._boosterInventory || !this.boosterBarView) {
            return;
        }

        this.boosterBarView.updateInventory(this._boosterInventory);
        this.boosterBarView.setSelectedBooster(this._selectedBoosterType);
    }

    private cancelBoosterSelection(): void {
        this._boardSelectionController.cancel();
        this._selectedBoosterType = null;
        this.updateBoosterBar();
    }

    private getBoosterRequiredSelectionCount(type: BoosterType): number {
        switch (type) {
            case BoosterType.Bomb:
                return 1;

            case BoosterType.Teleport:
                return 2;

            default:
                throw new Error(`[GameEntry] Unknown booster type: ${type}`);
        }
    }

    private syncBoosterInventoryToProgress(): void {
        if (!this._boosterInventory) {
            return;
        }

        this._progress.boosters.bomb = this._boosterInventory.getCount(BoosterType.Bomb);
        this._progress.boosters.teleport = this._boosterInventory.getCount(BoosterType.Teleport);

        this._progressStorage.save(this._progress);
    }

    private saveProgressAfterResolvedMove(): void {
        if (!this._session) {
            return;
        }

        const gameState = this._session.getGameStateModel();

        if (gameState.status !== GameStatus.Playing) {
            return;
        }

        if (this._boosterInventory) {
            this._progress.boosters.bomb = this._boosterInventory.getCount(BoosterType.Bomb);
            this._progress.boosters.teleport = this._boosterInventory.getCount(BoosterType.Teleport);
        }

        this._progress.activeLevel = {
            levelId: this._session.getLevelId(),
            boardCells: this._boardSnapshotFactory.createSnapshot(this._session.getBoardModel()),
            refillQueues: this._session.getRefillSource().createQueuesSnapshot(),
            score: gameState.score,
            movesLeft: gameState.movesLeft,
        };

        this._progressStorage.save(this._progress);
    }

    private updateHud(): void {
        if (!this._session || !this.gameHudView) {
            return;
        }

        this.gameHudView.updateHud(this._session.getGameStateModel());
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