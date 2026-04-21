import { BoardGroupsModel } from "../groups/BoardGroupsModel";
import { BoardModel } from "../models/BoardModel";
import { GameStateModel } from "../models/GameStateModel";
import { RefillSourceModel } from "./RefillSourceModel";

export class LevelSession {
    private readonly _levelId: string;
    private readonly _boardModel: BoardModel;
    private readonly _gameStateModel: GameStateModel;
    private readonly _refillSource: RefillSourceModel;

    private _boardGroupsModel: BoardGroupsModel | null;

    constructor(
        levelId: string,
        boardModel: BoardModel,
        gameStateModel: GameStateModel,
        refillSource: RefillSourceModel,
        boardGroupsModel: BoardGroupsModel | null = null
    ) {
        this._levelId = levelId;
        this._boardModel = boardModel;
        this._gameStateModel = gameStateModel;
        this._refillSource = refillSource;
        this._boardGroupsModel = boardGroupsModel;
    }

    public getLevelId(): string {
        return this._levelId;
    }

    public getBoardModel(): BoardModel {
        return this._boardModel;
    }

    public getGameStateModel(): GameStateModel {
        return this._gameStateModel;
    }

    public getRefillSource(): RefillSourceModel {
        return this._refillSource;
    }

    public getBoardGroupsModel(): BoardGroupsModel | null {
        return this._boardGroupsModel;
    }

    public setBoardGroupsModel(boardGroupsModel: BoardGroupsModel): void {
        this._boardGroupsModel = boardGroupsModel;
    }
}