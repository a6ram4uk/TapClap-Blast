import { TileData } from "../../core/models/TileData";
import { TileType } from "../../core/models/TileType";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TileView extends cc.Component {
    @property(cc.Sprite)
    public fillSprite: cc.Sprite = null!;

    @property(cc.Label)
    public debugLabel: cc.Label = null!;

    private _tileId: number = 0;

    public getTileId(): number {
        return this._tileId;
    }

    public setup(tile: TileData): void {
        this._tileId = tile.tileId;
        this.node.name = `Tile_${tile.tileId}_${tile.x}_${tile.y}`;

        this.applyVisual(tile);
    }

    private applyVisual(tile: TileData): void {
        if (tile.type !== TileType.Normal) {
            this.fillSprite.node.color = cc.Color.WHITE;
            if (this.debugLabel) {
                this.debugLabel.string = tile.type;
            }
            return;
        }

        this.fillSprite.node.color = this.resolveNormalColor(tile.color);

        if (this.debugLabel) {
            this.debugLabel.string = `${tile.color}`;
        }
    }

    private resolveNormalColor(color: number | null): cc.Color {
        switch (color) {
            case 1:
                return new cc.Color(88, 170, 255);
            case 2:
                return new cc.Color(255, 96, 96);
            case 3:
                return new cc.Color(255, 215, 64);
            case 4:
                return new cc.Color(120, 220, 120);
            case 5:
                return new cc.Color(190, 120, 255);
            default:
                return cc.Color.WHITE;
        }
    }
}