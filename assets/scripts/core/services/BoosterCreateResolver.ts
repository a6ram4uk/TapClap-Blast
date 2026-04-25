import { BoosterCreateStep } from "../actions/BoosterCreateStep";
import { TileData } from "../models/TileData";
import { TileType } from "../models/TileType";
import { TileIdProvider } from "./TileIdProvider";

export class BoosterCreateResolver {
    public resolveFromNormalGroup(
        clickedTile: TileData,
        groupTiles: TileData[],
        tileIdProvider: TileIdProvider
    ): BoosterCreateStep | null {
        const groupSize = groupTiles.length;

        if (groupSize < 5) {
            return null;
        }

        const boosterType = this.resolveBoosterType(groupTiles);
        const color = boosterType === TileType.Disco ? clickedTile.color : null;

        if (boosterType === TileType.Disco && color === null) {
            throw new Error("[BoosterCreateResolver] Disco booster requires source color.");
        }

        return new BoosterCreateStep([
            {
                tileId: tileIdProvider.getNextId(),
                x: clickedTile.x,
                y: clickedTile.y,
                type: boosterType,
                color,
            },
        ]);
    }

    private resolveBoosterType(groupTiles: TileData[]): TileType {
        const groupSize = groupTiles.length;

        if (groupSize >= 12) {
            return TileType.Disco;
        }

        if (groupSize >= 9) {
            return TileType.Bomb;
        }

        return this.resolveRocketType(groupTiles);
    }

    private resolveRocketType(groupTiles: TileData[]): TileType {
        const countByX = new Map<number, number>();
        const countByY = new Map<number, number>();

        for (const tile of groupTiles) {
            countByX.set(tile.x, (countByX.get(tile.x) ?? 0) + 1);
            countByY.set(tile.y, (countByY.get(tile.y) ?? 0) + 1);
        }

        const maxInColumn = this.getMaxCount(countByX);
        const maxInRow = this.getMaxCount(countByY);

        if (maxInColumn > maxInRow) {
            return TileType.RocketVertical;
        }

        return TileType.RocketHorizontal;
    }

    private getMaxCount(map: Map<number, number>): number {
        let max = 0;

        map.forEach((value) => {
            if (value > max) {
                max = value;
            }
        });

        return max;
    }
}