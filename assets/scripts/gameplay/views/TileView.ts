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
    private _clickHandler: ((tileId: number) => void) | null = null;
    private _isAnimatingInvalidClick: boolean = false;

    public getTileId(): number {
        return this._tileId;
    }

    public setup(tile: TileData): void {
        this._tileId = tile.tileId;
        this.node.name = `Tile_${tile.tileId}_${tile.x}_${tile.y}`;

        this.applyVisual(tile);
        this.registerInput();
    }

    public setClickHandler(handler: (tileId: number) => void): void {
        this._clickHandler = handler;
    }

    public playInvalidClickFeedback(): void {
        if (this._isAnimatingInvalidClick) {
            return;
        }

        this._isAnimatingInvalidClick = true;

        this.node.stopAllActions();

        const originalScale = this.node.scale;

        const sequence = cc.sequence(
            cc.scaleTo(0.06, originalScale * 0.92),
            cc.scaleTo(0.08, originalScale * 1.04),
            cc.scaleTo(0.06, originalScale)
        );

        this.node.runAction(
            cc.sequence(
                sequence,
                cc.callFunc(() => {
                    this._isAnimatingInvalidClick = false;
                })
            )
        );
    }

    private registerInput(): void {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchEnd(): void {
        if (this._clickHandler) {
            this._clickHandler(this._tileId);
        }
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