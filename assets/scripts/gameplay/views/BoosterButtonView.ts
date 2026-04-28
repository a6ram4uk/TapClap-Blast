import { BoosterType } from "../../core/boosters/BoosterType";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BoosterButtonView extends cc.Component {
    @property({ type: cc.Enum(BoosterType) })
    public boosterType: BoosterType = BoosterType.Bomb;

    @property(cc.Label)
    public countLabel: cc.Label = null!;

    @property(cc.Node)
    public highlight: cc.Node = null!;

    private _clickHandler: ((type: BoosterType) => void) | null = null;

    protected onLoad(): void {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onClicked, this);
        this.setSelected(false);
    }

    public setClickHandler(handler: (type: BoosterType) => void): void {
        this._clickHandler = handler;
    }

    public setCount(count: number): void {
        if (this.countLabel) {
            this.countLabel.string = `${count}`;
        }
    }

    public setSelected(isSelected: boolean): void {
        if (this.highlight) {
            this.highlight.active = isSelected;
        }
    }

    private onClicked(): void {
        if (this._clickHandler) {
            this._clickHandler(this.boosterType);
        }
    }
}