import { LevelData } from "../data/LevelData";
import { LevelSession } from "../session/LevelSession";
import { RefillSourceModel } from "../session/RefillSourceModel";

export class LevelSessionFactory {
    public createFromLevelData(levelData: LevelData): LevelSession {
        const refillSource = new RefillSourceModel(
            this.buildRefillQueues(levelData.width, levelData.supply),
            levelData.randomTileTypes
        );

        return new LevelSession(levelData, refillSource);
    }

    private buildRefillQueues(width: number, visualSupply: number[]): number[][] {
        const queues: number[][] = [];

        for (let x = 0; x < width; x++) {
            queues.push([]);
        }

        const supplyRowCount = visualSupply.length / width;

        for (let rowFromTop = supplyRowCount - 1; rowFromTop >= 0; rowFromTop--) {
            const rowStartIndex = rowFromTop * width;

            for (let x = 0; x < width; x++) {
                queues[x].push(visualSupply[rowStartIndex + x]);
            }
        }

        return queues;
    }
}