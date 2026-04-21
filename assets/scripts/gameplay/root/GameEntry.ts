import { BoardFactory } from "../../core/board/BoardFactory";
import { BoardGroupsModel } from "../../core/groups/BoardGroupsModel";
import { GroupFinder } from "../../core/groups/GroupFinder";
import { BoardModel } from "../../core/models/BoardModel";
import { TileData } from "../../core/models/TileData";
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
    private readonly _groupFinder: GroupFinder = new GroupFinder();

    private _boardModel: BoardModel | null = null;
    private _boardGroupsModel: BoardGroupsModel | null = null;
    private _isBusy: boolean = false;

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

        this._boardModel = this._boardFactory.createInitialBoard(levelSession);
        this.rebuildBoardGroupsModel();

        this.boardView.setTileClickHandler(this.onTileClicked.bind(this));
        this.boardView.render(this._boardModel);

        cc.log(`[GameEntry] Loaded level: ${currentLevelId}`);

        if (this._boardGroupsModel) {
            const groups = this._boardGroupsModel.getAllGroups();
            cc.log(`[Groups] total groups: ${groups.length}`);
            cc.log("[Groups] sizes:", groups.map(g => g.tiles.length).join(", "));
        }
    }

    private onTileClicked(tileId: number): void {
        if (this._isBusy) {
            return;
        }

        if (!this._boardModel || !this._boardGroupsModel) {
            return;
        }

        const clickedTile = this.findTileById(tileId);
        if (!clickedTile) {
            return;
        }

        const group = this._boardGroupsModel.getGroupByTileId(tileId);

        if (group === null) {
            cc.log(`[Click] invalid tileId=${tileId}`);
            this.boardView.playInvalidClick(tileId);
            return;
        }

        cc.log(
            `[Click] valid tileId=${tileId}, groupId=${group.groupId}, groupSize=${group.tiles.length}`
        );
    }

    private rebuildBoardGroupsModel(): void {
        if (!this._boardModel) {
            return;
        }

        const groups = this._groupFinder.findAllGroups(this._boardModel);
        this._boardGroupsModel = new BoardGroupsModel(
            groups,
            this._boardModel.getWidth()
        );
    }

    private findTileById(tileId: number): TileData | null {
        if (!this._boardModel) {
            return null;
        }

        let foundTile: TileData | null = null;

        this._boardModel.forEachTile((tile) => {
            if (tile !== null && tile.tileId === tileId) {
                foundTile = tile;
            }
        });

        return foundTile;
    }
}