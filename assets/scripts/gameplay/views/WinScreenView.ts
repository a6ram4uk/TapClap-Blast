import ScreenView from "./ScreenView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class WinScreenView extends ScreenView {
    @property(cc.Node)
    public nextButton: cc.Node = null!;

    private _nextHandler: (() => void) | null = null;

    protected onLoad(): void {
        super.onLoad();

        if (this.nextButton) {
            this.nextButton.on(cc.Node.EventType.TOUCH_END, this.onNextClicked, this);
        }
    }

    public setNextHandler(handler: () => void): void {
        this._nextHandler = handler;
    }

    private onNextClicked(): void {
        if (this._nextHandler) {
            this._nextHandler();
        }
    }
}