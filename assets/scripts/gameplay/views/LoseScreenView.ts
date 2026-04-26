import ScreenView from "./ScreenView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LoseScreenView extends ScreenView {
    @property(cc.Node)
    public restartButton: cc.Node = null!;

    private _restartHandler: (() => void) | null = null;

    protected onLoad(): void {
        super.onLoad();

        if (this.restartButton) {
            this.restartButton.on(cc.Node.EventType.TOUCH_END, this.onRestartClicked, this);
        }
    }

    public setRestartHandler(handler: () => void): void {
        this._restartHandler = handler;
    }

    private onRestartClicked(): void {
        if (this._restartHandler) {
            this._restartHandler();
        }
    }
}