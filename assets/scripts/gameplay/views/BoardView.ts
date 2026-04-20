import { BoardModel } from "../../core/models/BoardModel";
import TileView from "./TileView";
import { BoardLayoutResolver } from "../board/BoardLayoutResolver";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BoardView extends cc.Component {
    @property(cc.Node)
    public boardRoot: cc.Node = null!;

    @property(cc.Node)
    public boardContent: cc.Node = null!;

    @property(cc.Prefab)
    public tilePrefab: cc.Prefab = null!;

    @property
    public baseCellSize: number = 120;

    private readonly _layoutResolver: BoardLayoutResolver = new BoardLayoutResolver();

    public render(boardModel: BoardModel): void {
        this.clearBoard();

        this.applyLayout(boardModel);

        boardModel.forEachTile((tile, x, y) => {
            if (tile === null) {
                return;
            }

            const tileNode = cc.instantiate(this.tilePrefab);
            tileNode.parent = this.boardContent;
            tileNode.setAnchorPoint(0, 0);
            tileNode.setContentSize(this.baseCellSize, this.baseCellSize);
            tileNode.setPosition(
                x * this.baseCellSize,
                y * this.baseCellSize
            );

            const tileView = tileNode.getComponent(TileView);
            tileView.setup(tile);
        });
    }

    private applyLayout(boardModel: BoardModel): void {
        const canvasSize = cc.view.getVisibleSize();

        const layout = this._layoutResolver.resolve(
            canvasSize.width,
            canvasSize.height,
            boardModel.getWidth(),
            boardModel.getHeight(),
            this.baseCellSize
        );

        this.boardRoot.setScale(layout.scale);
        this.boardRoot.setPosition(layout.positionX, layout.positionY);
    }

    private clearBoard(): void {
        this.boardContent.removeAllChildren();
    }
}