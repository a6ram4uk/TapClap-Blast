import { TileData } from "./TileData";
import { TileType } from "./TileType";

export interface DecodedTileCode {
    type: TileType;
    color: number | null;
}

export class TileCodeMapper {
    public static readonly EMPTY = 0;

    public static readonly NORMAL_COLOR_MIN = 1;
    public static readonly NORMAL_COLOR_MAX = 5;

    public static readonly ROCKET_HORIZONTAL = 55;
    public static readonly ROCKET_VERTICAL = 66;
    public static readonly BOMB = 77;

    public static readonly DISCO_COLOR_MIN = 100;
    public static readonly DISCO_COLOR_MAX = 119;

    public isEmpty(code: number): boolean {
        return code === TileCodeMapper.EMPTY;
    }

    public encode(tile: TileData | null): number {
        if (tile === null) {
            return TileCodeMapper.EMPTY;
        }

        switch (tile.type) {
            case TileType.Normal:
                if (tile.color === null) {
                    throw new Error("[TileCodeMapper] Normal tile requires color.");
                }

                this.validateNormalColor(tile.color);
                return tile.color;

            case TileType.RocketHorizontal:
                return TileCodeMapper.ROCKET_HORIZONTAL;

            case TileType.RocketVertical:
                return TileCodeMapper.ROCKET_VERTICAL;

            case TileType.Bomb:
                return TileCodeMapper.BOMB;

            case TileType.Disco:
                if (tile.color === null) {
                    throw new Error("[TileCodeMapper] Disco tile requires color.");
                }

                this.validateDiscoColor(tile.color);
                return TileCodeMapper.DISCO_COLOR_MIN + tile.color - 1;

            default:
                throw new Error(`[TileCodeMapper] Unknown tile type: ${tile.type}`);
        }
    }

    public decode(code: number): DecodedTileCode {
        if (this.isEmpty(code)) {
            throw new Error("[TileCodeMapper] Cannot decode empty tile as TileData.");
        }

        if (code >= TileCodeMapper.NORMAL_COLOR_MIN && code <= TileCodeMapper.NORMAL_COLOR_MAX) {
            return {
                type: TileType.Normal,
                color: code,
            };
        }

        if (code === TileCodeMapper.ROCKET_HORIZONTAL) {
            return {
                type: TileType.RocketHorizontal,
                color: null,
            };
        }

        if (code === TileCodeMapper.ROCKET_VERTICAL) {
            return {
                type: TileType.RocketVertical,
                color: null,
            };
        }

        if (code === TileCodeMapper.BOMB) {
            return {
                type: TileType.Bomb,
                color: null,
            };
        }

        if (code >= TileCodeMapper.DISCO_COLOR_MIN && code <= TileCodeMapper.DISCO_COLOR_MAX) {
            return {
                type: TileType.Disco,
                color: code - TileCodeMapper.DISCO_COLOR_MIN + 1,
            };
        }

        throw new Error(`[TileCodeMapper] Unknown tile code: ${code}`);
    }

    private validateNormalColor(color: number): void {
        if (color < TileCodeMapper.NORMAL_COLOR_MIN || color > TileCodeMapper.NORMAL_COLOR_MAX) {
            throw new Error(`[TileCodeMapper] Invalid normal color: ${color}`);
        }
    }

    private validateDiscoColor(color: number): void {
        const maxDiscoColor = TileCodeMapper.DISCO_COLOR_MAX - TileCodeMapper.DISCO_COLOR_MIN + 1;

        if (color < 1 || color > maxDiscoColor) {
            throw new Error(`[TileCodeMapper] Invalid disco color: ${color}`);
        }
    }
}