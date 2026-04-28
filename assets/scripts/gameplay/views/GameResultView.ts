import { GameStatus } from "../../core/models/GameStatus";
import LoseScreenView from "./LoseScreenView";
import WinScreenView from "./WinScreenView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameResultView extends cc.Component {
    @property(WinScreenView)
    public winScreen: WinScreenView = null!;

    @property(LoseScreenView)
    public loseScreen: LoseScreenView = null!;

    public hide(): void {
        if (this.winScreen) {
            this.winScreen.hideImmediate();
        }

        if (this.loseScreen) {
            this.loseScreen.hideImmediate();
        }
    }

    public async show(status: GameStatus): Promise<void> {
        this.hide();

        if (status === GameStatus.Won) {
            await this.winScreen.show();
            return;
        }

        if (status === GameStatus.Lost) {
            await this.loseScreen.show();
        }
    }

    public setNextHandler(handler: () => void): void {
        this.winScreen.setNextHandler(handler);
    }

    public setRestartHandler(handler: () => void): void {
        this.loseScreen.setRestartHandler(handler);
    }
}