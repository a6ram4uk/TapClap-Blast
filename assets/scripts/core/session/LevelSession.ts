import { LevelData } from "../data/LevelData";
import { RefillSourceModel } from "./RefillSourceModel";

export class LevelSession {
    private readonly _levelData: LevelData;
    private readonly _refillSource: RefillSourceModel;

    constructor(levelData: LevelData, refillSource: RefillSourceModel) {
        this._levelData = levelData;
        this._refillSource = refillSource;
    }

    public getLevelData(): LevelData {
        return this._levelData;
    }

    public getLevelId(): string {
        return this._levelData.id;
    }

    public getWidth(): number {
        return this._levelData.width;
    }

    public getHeight(): number {
        return this._levelData.height;
    }

    public getStartMoves(): number {
        return this._levelData.moves;
    }

    public getTargetScore(): number {
        return this._levelData.targetScore;
    }

    public getStartCells(): number[] {
        return this._levelData.cells.slice();
    }

    public getRefillSource(): RefillSourceModel {
        return this._refillSource;
    }
}