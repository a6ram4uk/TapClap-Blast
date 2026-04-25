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
        const activatedBoosterIds = new Set<number>();

        let currentWave = this.dedupeAndSortBoosters(initialBoosters);

        while (currentWave.length > 0) {
            const currentWaveBoosterIds = new Set<number>(
                currentWave.map(tile => tile.tileId)
            );

            const currentWaveDestroyedTiles = new Map<number, TileData>();
            const nextWaveBoosters = new Map<number, TileData>();

            for (const booster of currentWave) {
                if (activatedBoosterIds.has(booster.tileId)) {
                    continue;
                }

                activatedBoosterIds.add(booster.tileId);

                const affectedTiles = this._boosterActivationResolver.resolveAffectedTiles(
                    booster,
                    boardModel
                );

                for (const affectedTile of affectedTiles) {
                    if (destroyedTileIds.has(affectedTile.tileId)) {
                        continue;
                    }

                    const isBooster = affectedTile.type !== TileType.Normal;
                    const isCurrentWaveBooster = currentWaveBoosterIds.has(affectedTile.tileId);

                    if (isBooster && !isCurrentWaveBooster) {
                        if (!activatedBoosterIds.has(affectedTile.tileId)) {
                            nextWaveBoosters.set(affectedTile.tileId, affectedTile);
                        }

                        continue;
                    }

                    if (!currentWaveDestroyedTiles.has(affectedTile.tileId)) {
                        currentWaveDestroyedTiles.set(affectedTile.tileId, affectedTile);
                    }
                }
            }

            if (currentWaveDestroyedTiles.size > 0) {
                const destroyedTiles = Array.from(currentWaveDestroyedTiles.values());

                destroyedTiles.sort((a, b) => {
                    if (a.y !== b.y) {
                        return a.y - b.y;
                    }

                    return a.x - b.x;
                });

                destroySteps.push(
                    new DestroyStep(destroyedTiles.map(tile => tile.tileId))
                );

                for (const tile of destroyedTiles) {
                    destroyedTileIds.add(tile.tileId);
                }
            }

            currentWave = this.dedupeAndSortBoosters(
                Array.from(nextWaveBoosters.values())
            );
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