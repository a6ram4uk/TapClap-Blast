import { GameStatus } from "./GameStatus";

export class GameStateModel {
    public score: number;
    public movesLeft: number;
    public targetScore: number;
    public status: GameStatus;

    constructor(
        score: number,
        movesLeft: number,
        targetScore: number,
        status: GameStatus = GameStatus.Playing
    ) {
        this.score = score;
        this.movesLeft = movesLeft;
        this.targetScore = targetScore;
        this.status = status;
    }
}