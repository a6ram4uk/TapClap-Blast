import { BoardFactory } from "../board/BoardFactory";
import { LevelData } from "../data/LevelData";
import { GameStateModel } from "../models/GameStateModel";
import { GameStatus } from "../models/GameStatus";
import { LevelSession } from "../session/LevelSession";
import { RefillSourceModel } from "../session/RefillSourceModel";

export class LevelSessionFactory {
    private readonly _boardFactory: BoardFactory;

    constructor() {
        this._boardFactory = new BoardFactory();
    }

    public createFromLevelData(levelData: LevelData): LevelSession {
        const refillSource = new RefillSourceModel(
            this.buildRefillQueues(levelData.width, levelData.supply),
            levelData.randomTileTypes
        );

        const boardModel = this._boardFactory.createInitialBoardFromLevelData(levelData);

        const gameStateModel = new GameStateModel(
            0,
            levelData.moves,
            levelData.targetScore,
            GameStatus.Playing
        );

        return new LevelSession(
            levelData.id,
            boardModel,
            gameStateModel,
            refillSource
        );
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