import { RefillSpawn } from "../actions/RefillStep";
import { SpawnSourceType } from "../actions/SpawnSourceType";
import { TileData } from "../models/TileData";
import { TileType } from "../models/TileType";
import { RefillSourceModel } from "../session/RefillSourceModel";
import { RandomProvider } from "../utils/RandomProvider";

export interface CreatedRefillTile {
    tile: TileData;
    spawn: RefillSpawn;
}

export class RefillTileFactory {
    private readonly _randomProvider: RandomProvider;
    private _nextTileId: number;

    constructor(randomProvider: RandomProvider, startTileId: number = 1) {
        this._randomProvider = randomProvider;
        this._nextTileId = startTileId;
    }

    public syncNextTileIdFromBoard(existingTileIds: number[]): void {
        let maxId = 0;

        for (const tileId of existingTileIds) {
            if (tileId > maxId) {
                maxId = tileId;
            }
        }

        if (this._nextTileId <= maxId) {
            this._nextTileId = maxId + 1;
        }
    }

    public createForCell(
        refillSource: RefillSourceModel,
        x: number,
        y: number
    ): CreatedRefillTile {
        const preparedColor = refillSource.popPreparedTile(x);

        let color: number;
        let sourceType: SpawnSourceType;

        if (preparedColor !== null) {
            color = preparedColor;
            sourceType = SpawnSourceType.Supply;
        } else {
            color = this._randomProvider.pickFromArray(refillSource.getRandomTileTypes());
            sourceType = SpawnSourceType.Random;
        }

        const tileId = this._nextTileId++;
        const tile = new TileData(
            tileId,
            x,
            y,
            TileType.Normal,
            color
        );

        return {
            tile,
            spawn: {
                tileId,
                x,
                y,
                color,
                sourceType,
            },
        };
    }
}