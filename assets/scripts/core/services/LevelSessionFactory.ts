import { BoardFactory } from "../board/BoardFactory";
import { LevelData } from "../data/LevelData";
import { GameStateModel } from "../models/GameStateModel";
import { GameStatus } from "../models/GameStatus";
import { ActiveLevelSaveData } from "../progress/ActiveLevelSaveData";
import { BoardSnapshotFactory } from "../progress/BoardSnapshotFactory";
import { LevelSession } from "../session/LevelSession";
import { RefillSourceModel } from "../session/RefillSourceModel";

export class LevelSessionFactory {
    private readonly _boardFactory: BoardFactory;
    private readonly _boardSnapshotFactory: BoardSnapshotFactory;

    constructor() {
        this._boardFactory = new BoardFactory();
        this._boardSnapshotFactory = new BoardSnapshotFactory();
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

    public createFromSaveData(
        levelData: LevelData,
        saveData: ActiveLevelSaveData
    ): LevelSession {
        if (saveData.levelId !== levelData.id) {
            throw new Error(
                `[LevelSessionFactory] Save levelId mismatch. Save=${saveData.levelId}, Level=${levelData.id}`
            );
        }

        const boardModel = this._boardSnapshotFactory.createBoardFromSnapshot(
            levelData.width,
            levelData.height,
            saveData.boardCells
        );

        const refillSource = new RefillSourceModel(
            saveData.refillQueues,
            levelData.randomTileTypes
        );

        const gameStateModel = new GameStateModel(
            saveData.score,
            saveData.movesLeft,
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
                const value = visualSupply[rowStartIndex + x];

                if (value !== 0) {
                    queues[x].push(value);
                }
            }
        }

        return queues;
    }
}