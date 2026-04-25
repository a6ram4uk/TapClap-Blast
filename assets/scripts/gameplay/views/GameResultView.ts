import { GameStatus } from "../../core/models/GameStatus";
import { GameStateModel } from "../../core/models/GameStateModel";

const { ccclass } = cc._decorator;

@ccclass
export default class GameResultView extends cc.Component {
    public show(status: GameStatus, gameState: GameStateModel): void {
        if (status === GameStatus.Won) {
            cc.log(
                `[GameResultView] YOU WIN! score=${gameState.score}, target=${gameState.targetScore}, movesLeft=${gameState.movesLeft}`
            );
            return;
        }

        if (status === GameStatus.Lost) {
            cc.log(
                `[GameResultView] YOU LOSE! score=${gameState.score}, target=${gameState.targetScore}, movesLeft=${gameState.movesLeft}`
            );
        }
    }

    public hide(): void {
        // Future UI screen will be hidden here.
    }
}