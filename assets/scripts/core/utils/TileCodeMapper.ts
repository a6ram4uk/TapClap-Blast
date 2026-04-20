export enum TileCodeKind {
    Empty = "Empty",
    Normal = "Normal",
    RocketHorizontal = "RocketHorizontal",
    RocketVertical = "RocketVertical",
    Bomb = "Bomb",
    Disco = "Disco",
}

export interface DecodedTileCode {
    kind: TileCodeKind;
    color: number | null;
}

export class TileCodeMapper {
    public static readonly EMPTY_CODE = 0;

    public static readonly NORMAL_MIN_CODE = 1;
    public static readonly NORMAL_MAX_CODE = 49;

    public static readonly ROCKET_HORIZONTAL_CODE = 50;
    public static readonly ROCKET_VERTICAL_CODE = 60;
    public static readonly BOMB_CODE = 70;

    public static readonly DISCO_MIN_CODE = 80;
    public static readonly DISCO_MAX_CODE = 99;

    public encodeEmpty(): number {
        return TileCodeMapper.EMPTY_CODE;
    }

    public encodeNormal(color: number): number {
        this.validateNormalColor(color);
        return color;
    }

    public encodeRocketHorizontal(): number {
        return TileCodeMapper.ROCKET_HORIZONTAL_CODE;
    }

    public encodeRocketVertical(): number {
        return TileCodeMapper.ROCKET_VERTICAL_CODE;
    }

    public encodeBomb(): number {
        return TileCodeMapper.BOMB_CODE;
    }

    public encodeDisco(color: number): number {
        this.validateDiscoColor(color);
        return TileCodeMapper.DISCO_MIN_CODE + color - 1;
    }

    public decode(code: number): DecodedTileCode {
        if (code === TileCodeMapper.EMPTY_CODE) {
            return {
                kind: TileCodeKind.Empty,
                color: null,
            };
        }

        if (this.isNormalCode(code)) {
            return {
                kind: TileCodeKind.Normal,
                color: code,
            };
        }

        if (code === TileCodeMapper.ROCKET_HORIZONTAL_CODE) {
            return {
                kind: TileCodeKind.RocketHorizontal,
                color: null,
            };
        }

        if (code === TileCodeMapper.ROCKET_VERTICAL_CODE) {
            return {
                kind: TileCodeKind.RocketVertical,
                color: null,
            };
        }

        if (code === TileCodeMapper.BOMB_CODE) {
            return {
                kind: TileCodeKind.Bomb,
                color: null,
            };
        }

        if (this.isDiscoCode(code)) {
            return {
                kind: TileCodeKind.Disco,
                color: code - TileCodeMapper.DISCO_MIN_CODE + 1,
            };
        }

        throw new Error(`[TileCodeMapper] Unsupported tile code: ${code}`);
    }

    public isEmptyCode(code: number): boolean {
        return code === TileCodeMapper.EMPTY_CODE;
    }

    public isNormalCode(code: number): boolean {
        return (
            code >= TileCodeMapper.NORMAL_MIN_CODE &&
            code <= TileCodeMapper.NORMAL_MAX_CODE
        );
    }

    public isDiscoCode(code: number): boolean {
        return (
            code >= TileCodeMapper.DISCO_MIN_CODE &&
            code <= TileCodeMapper.DISCO_MAX_CODE
        );
    }

    private validateNormalColor(color: number): void {
        if (!Number.isInteger(color)) {
            throw new Error(`[TileCodeMapper] Normal color must be an integer. Got: ${color}`);
        }

        if (
            color < TileCodeMapper.NORMAL_MIN_CODE ||
            color > TileCodeMapper.NORMAL_MAX_CODE
        ) {
            throw new Error(
                `[TileCodeMapper] Normal color is out of supported range. ` +
                `Expected ${TileCodeMapper.NORMAL_MIN_CODE}..${TileCodeMapper.NORMAL_MAX_CODE}, got: ${color}`
            );
        }
    }

    private validateDiscoColor(color: number): void {
        if (!Number.isInteger(color)) {
            throw new Error(`[TileCodeMapper] Disco color must be an integer. Got: ${color}`);
        }

        const discoColorCapacity =
            TileCodeMapper.DISCO_MAX_CODE - TileCodeMapper.DISCO_MIN_CODE + 1;

        if (color < 1 || color > discoColorCapacity) {
            throw new Error(
                `[TileCodeMapper] Disco color is out of supported range. ` +
                `Expected 1..${discoColorCapacity}, got: ${color}`
            );
        }
    }
}