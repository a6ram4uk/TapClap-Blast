import { GameStateModel } from "../../core/models/GameStateModel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameHudView extends cc.Component {
    @property(cc.Label)
    public movesLabel: cc.Label = null!;

    @property(cc.Label)
    public scoreLabel: cc.Label = null!;

    public updateHud(gameState: GameStateModel): void {
        if (this.movesLabel) {
            this.movesLabel.string = `${gameState.movesLeft}`;
        }

        if (this.scoreLabel) {
            this.scoreLabel.string = `${gameState.score} / ${gameState.targetScore}`;
        }
    }
}