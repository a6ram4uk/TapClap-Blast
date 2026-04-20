import { BoardFactory } from "../../core/board/BoardFactory";
import { LevelsCatalogLoader } from "../../core/loaders/LevelsCatalogLoader";
import { LevelLoader } from "../../core/loaders/LevelLoader";
import { LevelValidator } from "../../core/services/LevelValidator";
import { LevelSequenceResolver } from "../../core/services/LevelSequenceResolver";
import { LevelSessionFactory } from "../../core/services/LevelSessionFactory";
import BoardView from "../views/BoardView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameEntry extends cc.Component {
    @property(BoardView)
    public boardView: BoardView = null!;

    private readonly _validator: LevelValidator = new LevelValidator();
    private readonly _catalogLoader: LevelsCatalogLoader = new LevelsCatalogLoader(this._validator);
    private readonly _levelLoader: LevelLoader = new LevelLoader(this._validator);
    private readonly _levelSequenceResolver: LevelSequenceResolver = new LevelSequenceResolver();
    private readonly _sessionFactory: LevelSessionFactory = new LevelSessionFactory();
    private readonly _boardFactory: BoardFactory = new BoardFactory();

    protected async start(): Promise<void> {
        try {
            await this.bootstrap();
        } catch (error) {
            cc.error("[GameEntry] Bootstrap failed:", error);
        }
    }

    private async bootstrap(): Promise<void> {
        const completedLevelsCount = 0;

        const catalog = await this._catalogLoader.loadCatalog();
        const currentLevelId = this._levelSequenceResolver.resolveCurrentLevelId(
            catalog,
            completedLevelsCount
        );

        const levelData = await this._levelLoader.loadLevel(currentLevelId);
        const levelSession = this._sessionFactory.createFromLevelData(levelData);
        const boardModel = this._boardFactory.createInitialBoard(levelSession);

        this.boardView.render(boardModel);

        cc.log(`[GameEntry] Loaded level: ${currentLevelId}`);
    }
}