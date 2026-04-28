import { RefillSpawn } from "../actions/RefillStep";
import { SpawnSourceType } from "../actions/SpawnSourceType";
import { TileData } from "../models/TileData";
import { TileType } from "../models/TileType";
import { RefillSourceModel } from "../session/RefillSourceModel";
import { RandomProvider } from "../utils/RandomProvider";
import { TileIdProvider } from "./TileIdProvider";

export interface CreatedRefillTile {
    tile: TileData;
    spawn: RefillSpawn;
}

export class RefillTileFactory {
    private readonly _randomProvider: RandomProvider;
    private readonly _tileIdProvider: TileIdProvider;

    constructor(randomProvider: RandomProvider, tileIdProvider: TileIdProvider) {
        this._randomProvider = randomProvider;
        this._tileIdProvider = tileIdProvider;
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

        const tileId = this._tileIdProvider.getNextId();
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