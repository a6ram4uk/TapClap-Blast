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
    public static readonly EMPTY = 0;

    public encodeEmpty(): number {
        return TileCodeMapper.EMPTY;
    }

    public encodeNormal(color: number): number {
        this.validatePositiveColor(color, "Normal");
        return color;
    }

    public encodeRocketHorizontal(): number {
        return 50;
    }

    public encodeRocketVertical(): number {
        return 60;
    }

    public encodeBomb(): number {
        return 70;
    }

    public encodeDisco(color: number): number {
        this.validatePositiveColor(color, "Disco");
        return 80 + color;
    }

    public decode(code: number): DecodedTileCode {
        if (code === TileCodeMapper.EMPTY) {
            return {
                kind: TileCodeKind.Empty,
                color: null,
            };
        }

        if (code >= 1 && code <= 49) {
            return {
                kind: TileCodeKind.Normal,
                color: code,
            };
        }

        if (code === 50) {
            return {
                kind: TileCodeKind.RocketHorizontal,
                color: null,
            };
        }

        if (code === 60) {
            return {
                kind: TileCodeKind.RocketVertical,
                color: null,
            };
        }

        if (code === 70) {
            return {
                kind: TileCodeKind.Bomb,
                color: null,
            };
        }

        if (code >= 81 && code <= 89) {
            return {
                kind: TileCodeKind.Disco,
                color: code - 80,
            };
        }

        throw new Error(`[TileCodeMapper] Unsupported tile code: ${code}`);
    }

    private validatePositiveColor(color: number, label: string): void {
        if (!Number.isInteger(color) || color <= 0) {
            throw new Error(`[TileCodeMapper] ${label} color must be a positive integer. Got: ${color}`);
        }
    }
}