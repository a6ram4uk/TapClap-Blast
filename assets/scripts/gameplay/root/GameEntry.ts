import { BoardGroupsModel } from "../../core/groups/BoardGroupsModel";
import { GroupFinder } from "../../core/groups/GroupFinder";
import { TileData } from "../../core/models/TileData";
import { LevelsCatalogLoader } from "../../core/loaders/LevelsCatalogLoader";
import { LevelLoader } from "../../core/loaders/LevelLoader";
import { LevelValidator } from "../../core/services/LevelValidator";
import { LevelSequenceResolver } from "../../core/services/LevelSequenceResolver";
import { LevelSessionFactory } from "../../core/services/LevelSessionFactory";
import { LevelSession } from "../../core/session/LevelSession";
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
    private readonly _groupFinder: GroupFinder = new GroupFinder();

    private _session: LevelSession | null = null;
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
        this._session = this._sessionFactory.createFromLevelData(levelData);

        this.rebuildBoardGroupsModel();

        this.boardView.setTileClickHandler(this.onTileClicked.bind(this));
        this.boardView.render(this._session.getBoardModel());

        cc.log(`[GameEntry] Loaded level: ${this._session.getLevelId()}`);

        const boardGroupsModel = this._session.getBoardGroupsModel();
        if (boardGroupsModel) {
            const groups = boardGroupsModel.getAllGroups();
            cc.log(`[Groups] total groups: ${groups.length}`);
            cc.log("[Groups] sizes:", groups.map(g => g.tiles.length).join(", "));
        }
    }

    private onTileClicked(tileId: number): void {
        if (this._isBusy) {
            return;
        }

        if (!this._session) {
            return;
        }

        const clickedTile = this.findTileById(tileId);
        if (!clickedTile) {
            return;
        }

        const boardGroupsModel = this._session.getBoardGroupsModel();
        if (!boardGroupsModel) {
            return;
        }

        const group = boardGroupsModel.getGroupByTileId(tileId);

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
        if (!this._session) {
            return;
        }

        const boardModel = this._session.getBoardModel();
        const groups = this._groupFinder.findAllGroups(boardModel);

        this._session.setBoardGroupsModel(
            new BoardGroupsModel(groups, boardModel.getWidth())
        );
    }

    private findTileById(tileId: number): TileData | null {
        if (!this._session) {
            return null;
        }

        const boardModel = this._session.getBoardModel();
        let foundTile: TileData | null = null;

        boardModel.forEachTile((tile) => {
            if (tile !== null && tile.tileId === tileId) {
                foundTile = tile;
            }
        });

        return foundTile;
    }
}