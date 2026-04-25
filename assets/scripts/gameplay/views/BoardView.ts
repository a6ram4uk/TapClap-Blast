import { BoosterCreateInfo } from "../../core/actions/BoosterCreateStep";
import { FallMove } from "../../core/actions/FallStep";
import { RefillSpawn } from "../../core/actions/RefillStep";
import { BoardModel } from "../../core/models/BoardModel";
import { TileData } from "../../core/models/TileData";
import { TileType } from "../../core/models/TileType";
import { BoardLayoutResolver } from "../board/BoardLayoutResolver";
import { BoardAnimationConfig } from "../config/BoardAnimationConfig";
import TileView from "./TileView";
import TileSpriteProvider from "./TileSpriteProvider";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BoardView extends cc.Component {
    @property(cc.Node)
    public boardRoot: cc.Node = null!;

    @property(cc.Node)
    public boardContent: cc.Node = null!;

    @property(TileSpriteProvider)
    public spriteProvider: TileSpriteProvider = null!;

    @property(cc.Prefab)
    public tilePrefab: cc.Prefab = null!;

    private readonly _layoutResolver: BoardLayoutResolver = new BoardLayoutResolver();
    private readonly _tileViewsById: Map<number, TileView> = new Map<number, TileView>();

    private _tileClickHandler: ((tileId: number) => void) | null = null;
    private _cellSize: number = 0;

    public setTileClickHandler(handler: (tileId: number) => void): void {
        this._tileClickHandler = handler;
    }

    public render(boardModel: BoardModel): void {
        this.ensureCellSize();

        this.clearBoard();
        this.applyLayout(boardModel);

        boardModel.forEachTile((tile, x, y) => {
            if (tile === null) {
                return;
            }

            this.createAndSetupTileView(tile, x, y);
        });
    }

    public createBoosterViews(boosters: BoosterCreateInfo[]): void {
        this.ensureCellSize();

        for (const booster of boosters) {
            const tile = new TileData(
                booster.tileId,
                booster.x,
                booster.y,
                booster.type,
                booster.color
            );

            this.createAndSetupTileView(tile, booster.x, booster.y);
        }
    }

    public createRefillViews(spawns: RefillSpawn[]): void {
        this.ensureCellSize();

        for (const spawn of spawns) {
            const tile = new TileData(
                spawn.tileId,
                spawn.x,
                spawn.y,
                TileType.Normal,
                spawn.color
            );

            const tileView = this.createAndSetupTileView(tile, spawn.x, spawn.y);

            const startPosition = this.getLocalPosition(
                spawn.x,
                spawn.y + BoardAnimationConfig.REFILL_SPAWN_OFFSET_Y
            );

            tileView.setPosition(startPosition);
        }
    }

    public removeTileViews(tileIds: number[]): void {
        for (const tileId of tileIds) {
            this.removeTileView(tileId);
        }
    }

    public playInvalidClick(tileId: number): void {
        const tileView = this._tileViewsById.get(tileId);
        if (!tileView) {
            return;
        }

        tileView.playInvalidClickFeedback();
    }

    public async animateDestroy(tileIds: number[]): Promise<void> {
        const animations: Promise<void>[] = [];

        for (const tileId of tileIds) {
            const tileView = this._tileViewsById.get(tileId);
            if (!tileView) {
                continue;
            }

            animations.push(tileView.playDestroy());
        }

        await Promise.all(animations);
    }

    public async animateBoosterCreate(tileIds: number[]): Promise<void> {
        const animations: Promise<void>[] = [];

        for (const tileId of tileIds) {
            const tileView = this._tileViewsById.get(tileId);
            if (!tileView) {
                continue;
            }

            animations.push(tileView.playSpawn());
        }

        await Promise.all(animations);
    }

    public async animateFall(moves: FallMove[]): Promise<void> {
        const animations: Promise<void>[] = [];

        for (const move of moves) {
            const tileView = this._tileViewsById.get(move.tileId);
            if (!tileView) {
                continue;
            }

            animations.push(tileView.playMove(this.getLocalPosition(move.toX, move.toY)));
        }

        await Promise.all(animations);
    }

    public async animateRefill(spawns: RefillSpawn[]): Promise<void> {
        const animations: Promise<void>[] = [];

        for (const spawn of spawns) {
            const tileView = this._tileViewsById.get(spawn.tileId);
            if (!tileView) {
                continue;
            }

            const endPosition = this.getLocalPosition(spawn.x, spawn.y);
            animations.push(tileView.playMove(endPosition));
        }

        await Promise.all(animations);
    }

    private createAndSetupTileView(tile: TileData, x: number, y: number): TileView {
        if (this._tileViewsById.has(tile.tileId)) {
            this.removeTileView(tile.tileId);
        }

        const tileView = this.createTileView();
        const spriteFrame = this.getTileSprite(tile.type, tile.color);

        tileView.node.setPosition(this.getLocalPosition(x, y));
        tileView.setup(tile, spriteFrame);
        tileView.setClickHandler(this.onTileClickedFromView.bind(this));

        this._tileViewsById.set(tile.tileId, tileView);

        return tileView;
    }

    private removeTileView(tileId: number): void {
        const tileView = this._tileViewsById.get(tileId);
        if (!tileView) {
            return;
        }

        tileView.dispose();
        this._tileViewsById.delete(tileId);
    }

    private createTileView(): TileView {
        const tileNode = cc.instantiate(this.tilePrefab);
        tileNode.parent = this.boardContent;
        tileNode.setAnchorPoint(0, 0);

        return tileNode.getComponent(TileView);
    }

    private getLocalPosition(x: number, y: number): cc.Vec2 {
        this.ensureCellSize();

        return cc.v2(
            x * this._cellSize,
            y * this._cellSize
        );
    }

    private applyLayout(boardModel: BoardModel): void {
        this.ensureCellSize();

        const canvasSize = cc.view.getVisibleSize();

        const layout = this._layoutResolver.resolve(
            canvasSize.width,
            canvasSize.height,
            boardModel.getWidth(),
            boardModel.getHeight(),
            this._cellSize
        );

        this.boardRoot.setScale(layout.scale);
        this.boardRoot.setPosition(layout.positionX, layout.positionY);
    }

    private ensureCellSize(): void {
        if (this._cellSize > 0) {
            return;
        }

        if (!this.tilePrefab || !this.tilePrefab.data) {
            throw new Error("[BoardView] tilePrefab is not assigned.");
        }

        this._cellSize = this.tilePrefab.data.width;

        if (this._cellSize <= 0) {
            throw new Error(`[BoardView] Invalid tile prefab width: ${this._cellSize}`);
        }
    }

    private onTileClickedFromView(tileId: number): void {
        if (this._tileClickHandler) {
            this._tileClickHandler(tileId);
        }
    }

    private clearBoard(): void {
        this._tileViewsById.forEach((tileView) => {
            tileView.dispose();
        });

        this._tileViewsById.clear();
        this.boardContent.removeAllChildren();
    }

    private getTileSprite(tileType: TileType, color: number | null): cc.SpriteFrame {
        switch (tileType) {
            case TileType.Normal:
                if (color === null || color <= 0 || color > this.spriteProvider.normalTiles.length) {
                    throw new Error(`[BoardView] Invalid color: ${color}`);
                }
                return this.spriteProvider.normalTiles[color - 1];

            case TileType.RocketHorizontal:
                return this.spriteProvider.rocketHorizontal;

            case TileType.RocketVertical:
                return this.spriteProvider.rocketVertical;

            case TileType.Bomb:
                return this.spriteProvider.bomb;

            case TileType.Disco:
                return this.spriteProvider.disco;

            default:
                throw new Error(`[BoardView] Unknown tile type: ${tileType}`);
        }
    }
}