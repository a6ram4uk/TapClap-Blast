const { ccclass, property } = cc._decorator;

@ccclass
export default class ScreenView extends cc.Component {
    private static readonly FADE_TARGET_OPACITY = 180;
    private static readonly FADE_DURATION = 0.15;

    private static readonly PANEL_START_SCALE = 0.75;
    private static readonly PANEL_OVERSHOOT_SCALE = 1.06;
    private static readonly PANEL_IN_DURATION = 0.18;
    private static readonly PANEL_SETTLE_DURATION = 0.08;

    @property(cc.Node)
    public fade: cc.Node = null!;

    @property(cc.Node)
    public panel: cc.Node = null!;

    protected onLoad(): void {
        this.hideImmediate();
    }

    public async show(): Promise<void> {
        this.node.active = true;
        this.stopAnimations();

        this.fade.opacity = 0;
        this.panel.scale = ScreenView.PANEL_START_SCALE;
        this.panel.opacity = 255;

        await Promise.all([
            this.playFadeIn(),
            this.playPanelIn(),
        ]);
    }

    public hideImmediate(): void {
        this.stopAnimations();

        this.node.active = false;

        if (this.fade) {
            this.fade.opacity = 0;
        }

        if (this.panel) {
            this.panel.scale = 1;
            this.panel.opacity = 255;
        }
    }

    private playFadeIn(): Promise<void> {
        return new Promise(resolve => {
            cc.tween(this.fade)
                .to(ScreenView.FADE_DURATION, {
                    opacity: ScreenView.FADE_TARGET_OPACITY,
                })
                .call(() => resolve())
                .start();
        });
    }

    private playPanelIn(): Promise<void> {
        return new Promise(resolve => {
            cc.tween(this.panel)
                .to(
                    ScreenView.PANEL_IN_DURATION,
                    { scale: ScreenView.PANEL_OVERSHOOT_SCALE },
                    { easing: "backOut" }
                )
                .to(
                    ScreenView.PANEL_SETTLE_DURATION,
                    { scale: 1 }
                )
                .call(() => resolve())
                .start();
        });
    }

    private stopAnimations(): void {
        if (this.fade) {
            cc.Tween.stopAllByTarget(this.fade);
            this.fade.stopAllActions();
        }

        if (this.panel) {
            cc.Tween.stopAllByTarget(this.panel);
            this.panel.stopAllActions();
        }
    }
}