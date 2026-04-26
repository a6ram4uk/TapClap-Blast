const { ccclass, property } = cc._decorator;

@ccclass
export default class ButtonScaleFeedback extends cc.Component {
    @property(cc.Node)
    public visualRoot: cc.Node = null!;

    @property
    public pressedScale: number = 0.9;

    @property
    public duration: number = 0.08;

    protected onLoad(): void {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onDown, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onUp, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onUp, this);
    }

    private onDown(): void {
        cc.Tween.stopAllByTarget(this.visualRoot);

        cc.tween(this.visualRoot)
            .to(this.duration, { scale: this.pressedScale })
            .start();
    }

    private onUp(): void {
        cc.Tween.stopAllByTarget(this.visualRoot);

        cc.tween(this.visualRoot)
            .to(this.duration, { scale: 1 })
            .start();
    }
}