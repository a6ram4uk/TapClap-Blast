import { TileType } from "../../core/models/TileType";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TileSpriteProvider extends cc.Component {
    @property([cc.SpriteFrame])
    public normalTiles: cc.SpriteFrame[] = []; // index = color-1

    @property(cc.SpriteFrame)
    public rocketHorizontal: cc.SpriteFrame = null!;

    @property(cc.SpriteFrame)
    public rocketVertical: cc.SpriteFrame = null!;

    @property(cc.SpriteFrame)
    public bomb: cc.SpriteFrame = null!;

    @property(cc.SpriteFrame)
    public disco: cc.SpriteFrame = null!;

    public getSprite(tileType: TileType, color: number | null): cc.SpriteFrame {
        switch (tileType) {
            case TileType.Normal:
                if (color === null || color <= 0 || color > this.normalTiles.length) {
                    throw new Error(`[TileSpriteProvider] Invalid color: ${color}`);
                }
                return this.normalTiles[color - 1];

            case TileType.RocketHorizontal:
                return this.rocketHorizontal;

            case TileType.RocketVertical:
                return this.rocketVertical;

            case TileType.Bomb:
                return this.bomb;

            case TileType.Disco:
                return this.disco;

            default:
                throw new Error(`[TileSpriteProvider] Unknown tile type: ${tileType}`);
        }
    }
}