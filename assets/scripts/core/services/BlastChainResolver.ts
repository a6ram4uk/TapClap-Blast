import { DestroyStep } from "../actions/DestroyStep";
import { BoardModel } from "../models/BoardModel";
import { TileData } from "../models/TileData";
import { TileType } from "../models/TileType";
import { BoosterActivationResolver } from "./BoosterActivationResolver";

export class BlastChainResolver {
    private readonly _boosterActivationResolver: BoosterActivationResolver;

    constructor(boosterActivationResolver: BoosterActivationResolver) {
        this._boosterActivationResolver = boosterActivationResolver;
    }

    public resolveFromInitialBoosters(
        initialBoosters: TileData[],
        boardModel: BoardModel
    ): DestroyStep[] {
        const destroySteps: DestroyStep[] = [];
        const destroyedTileIds = new Set<number>();

        let currentWave = this.dedupeAndSortBoosters(initialBoosters);

        while (currentWave.length > 0) {
            const currentWaveBoosterIds = new Set<number>(
                currentWave.map(tile => tile.tileId)
            );

            const affectedTiles = new Map<number, TileData>();

            for (const booster of currentWave) {
                if (destroyedTileIds.has(booster.tileId)) {
                    continue;
                }

                const affectedByBooster = this._boosterActivationResolver.resolveAffectedTiles(
                    booster,
                    boardModel
                );

                for (const affectedTile of affectedByBooster) {
                    if (destroyedTileIds.has(affectedTile.tileId)) {
                        continue;
                    }

                    if (!affectedTiles.has(affectedTile.tileId)) {
                        affectedTiles.set(affectedTile.tileId, affectedTile);
                    }
                }
            }

            if (affectedTiles.size === 0) {
                break;
            }

            const affectedList = Array.from(affectedTiles.values());
            affectedList.sort((a, b) => {
                if (a.y !== b.y) {
                    return a.y - b.y;
                }

                return a.x - b.x;
            });

            destroySteps.push(
                new DestroyStep(affectedList.map(tile => tile.tileId))
            );

            const nextWaveById = new Map<number, TileData>();

            for (const tile of affectedList) {
                const isBooster = tile.type !== TileType.Normal;
                const isCurrentWaveBooster = currentWaveBoosterIds.has(tile.tileId);

                if (isBooster && !isCurrentWaveBooster && !destroyedTileIds.has(tile.tileId)) {
                    nextWaveById.set(tile.tileId, tile);
                }

                destroyedTileIds.add(tile.tileId);
            }

            currentWave = this.dedupeAndSortBoosters(Array.from(nextWaveById.values()));
        }

        return destroySteps;
    }

    private dedupeAndSortBoosters(boosters: TileData[]): TileData[] {
        const map = new Map<number, TileData>();

        for (const booster of boosters) {
            if (booster.type === TileType.Normal) {
                continue;
            }

            map.set(booster.tileId, booster);
        }

        const result = Array.from(map.values());

        result.sort((a, b) => {
            if (a.y !== b.y) {
                return a.y - b.y;
            }

            return a.x - b.x;
        });

        return result;
    }
}