import { BoardModel } from "../models/BoardModel";
import { TileData } from "../models/TileData";
import { TileType } from "../models/TileType";

export class BoosterActivationResolver {
    public resolveAffectedTiles(boosterTile: TileData, boardModel: BoardModel): TileData[] {
        switch (boosterTile.type) {
            case TileType.RocketHorizontal:
                return this.resolveHorizontalRocket(boosterTile, boardModel);

            case TileType.RocketVertical:
                return this.resolveVerticalRocket(boosterTile, boardModel);

            case TileType.Bomb:
                return this.resolveBomb(boosterTile, boardModel);

            case TileType.Disco:
                return this.resolveDisco(boosterTile, boardModel);

            default:
                throw new Error(`[BoosterActivationResolver] Unsupported booster type: ${boosterTile.type}`);
        }
    }

    private resolveHorizontalRocket(boosterTile: TileData, boardModel: BoardModel): TileData[] {
        const result: TileData[] = [];

        for (let x = 0; x < boardModel.getWidth(); x++) {
            const tile = boardModel.getTile(x, boosterTile.y);
            if (tile !== null) {
                result.push(tile);
            }
        }

        return result;
    }

    private resolveVerticalRocket(boosterTile: TileData, boardModel: BoardModel): TileData[] {
        const result: TileData[] = [];

        for (let y = 0; y < boardModel.getHeight(); y++) {
            const tile = boardModel.getTile(boosterTile.x, y);
            if (tile !== null) {
                result.push(tile);
            }
        }

        return result;
    }

    private resolveBomb(boosterTile: TileData, boardModel: BoardModel): TileData[] {
        const result: TileData[] = [];

        for (let y = boosterTile.y - 1; y <= boosterTile.y + 1; y++) {
            for (let x = boosterTile.x - 1; x <= boosterTile.x + 1; x++) {
                if (!boardModel.isInside(x, y)) {
                    continue;
                }

                const tile = boardModel.getTile(x, y);
                if (tile !== null) {
                    result.push(tile);
                }
            }
        }

        return result;
    }

    private resolveDisco(boosterTile: TileData, boardModel: BoardModel): TileData[] {
        if (boosterTile.color === null) {
            throw new Error("[BoosterActivationResolver] Disco booster requires color.");
        }

        const result: TileData[] = [];

        boardModel.forEachTile((tile) => {
            if (tile === null) {
                return;
            }

            if (tile.tileId === boosterTile.tileId) {
                result.push(tile);
                return;
            }

            if (tile.type === TileType.Normal && tile.color === boosterTile.color) {
                result.push(tile);
            }
        });

        return result;
    }
}