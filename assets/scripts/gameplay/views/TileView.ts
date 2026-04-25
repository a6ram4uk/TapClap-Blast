import { TileData } from "../../core/models/TileData";
import { TileType } from "../../core/models/TileType";
import { BoardAnimationConfig } from "../config/BoardAnimationConfig";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TileView extends cc.Component {
    @property(cc.Node)
    public visualRoot: cc.Node = null!;

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

        this.resetVisualState();
        this.applyVisual(tile);
        this.registerInput();
    }

    public setClickHandler(handler: (tileId: number) => void): void {
        this._clickHandler = handler;
    }

    public setPosition(position: cc.Vec2): void {
        this.node.setPosition(position);
    }

    public dispose(): void {
        this.stopTweens();
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.removeFromParent();
        this.node.destroy();
    }

    public playDestroy(): Promise<void> {
        this.stopTweens();

        return new Promise(resolve => {
            cc.tween(this.visualRoot)
                .to(
                    BoardAnimationConfig.DESTROY_DURATION,
                    {
                        scale: BoardAnimationConfig.DESTROY_SCALE,
                        opacity: 0,
                    },
                    { easing: BoardAnimationConfig.DESTROY_EASING }
                )
                .call(() => resolve())
                .start();
        });
    }

    public playSpawn(): Promise<void> {
        this.stopTweens();

        this.node.opacity = 255;
        this.node.scale = 1;

        this.visualRoot.opacity = 255;
        this.visualRoot.scale = BoardAnimationConfig.SPAWN_SCALE_FROM;
        this.visualRoot.active = true;

        return new Promise(resolve => {
            cc.tween(this.visualRoot)
                .to(
                    BoardAnimationConfig.SPAWN_DURATION_MAIN,
                    { scale: BoardAnimationConfig.SPAWN_SCALE_TO },
                    { easing: BoardAnimationConfig.SPAWN_EASING }
                )
                .to(
                    BoardAnimationConfig.SPAWN_DURATION_SETTLE,
                    { scale: 1 }
                )
                .call(() => resolve())
                .start();
        });
    }

    public playMove(target: cc.Vec2): Promise<void> {
        cc.Tween.stopAllByTarget(this.node);
        this.node.stopAllActions();

        return new Promise(resolve => {
            cc.tween(this.node)
                .to(
                    BoardAnimationConfig.MOVE_DURATION,
                    { position: cc.v3(target.x, target.y, 0) },
                    { easing: BoardAnimationConfig.MOVE_EASING }
                )
                .call(() => resolve())
                .start();
        });
    }

    public playInvalidClickFeedback(): void {
        if (this._isAnimatingInvalidClick) {
            return;
        }

        this._isAnimatingInvalidClick = true;

        cc.Tween.stopAllByTarget(this.visualRoot);
        this.visualRoot.stopAllActions();

        this.visualRoot.opacity = 255;

        cc.tween(this.visualRoot)
            .to(
                BoardAnimationConfig.INVALID_DURATION_DOWN,
                { scale: BoardAnimationConfig.INVALID_SCALE_DOWN }
            )
            .to(
                BoardAnimationConfig.INVALID_DURATION_UP,
                { scale: BoardAnimationConfig.INVALID_SCALE_UP }
            )
            .to(
                BoardAnimationConfig.INVALID_DURATION_DOWN,
                { scale: 1 }
            )
            .call(() => {
                this._isAnimatingInvalidClick = false;
            })
            .start();
    }

    private resetVisualState(): void {
        this.stopTweens();

        this.node.active = true;
        this.node.opacity = 255;
        this.node.scale = 1;

        this.visualRoot.active = true;
        this.visualRoot.opacity = 255;
        this.visualRoot.scale = 1;

        this._isAnimatingInvalidClick = false;
    }

    private stopTweens(): void {
        cc.Tween.stopAllByTarget(this.node);
        cc.Tween.stopAllByTarget(this.visualRoot);

        this.node.stopAllActions();
        this.visualRoot.stopAllActions();
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