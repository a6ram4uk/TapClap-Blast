import { BoosterInventoryModel } from "../../core/boosters/BoosterInventoryModel";
import { BoosterType } from "../../core/boosters/BoosterType";
import BoosterButtonView from "./BoosterButtonView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BoosterBarView extends cc.Component {
    @property([BoosterButtonView])
    public boosterButtons: BoosterButtonView[] = [];

    private _clickHandler: ((type: BoosterType) => void) | null = null;

    protected onLoad(): void {
        for (const button of this.boosterButtons) {
            button.setClickHandler(this.onBoosterClicked.bind(this));
        }
    }

    public setClickHandler(handler: (type: BoosterType) => void): void {
        this._clickHandler = handler;
    }

    public updateInventory(inventory: BoosterInventoryModel): void {
        for (const button of this.boosterButtons) {
            button.setCount(inventory.getCount(button.boosterType));
        }
    }

    public setSelectedBooster(type: BoosterType | null): void {
        for (const button of this.boosterButtons) {
            button.setSelected(type !== null && button.boosterType === type);
        }
    }

    private onBoosterClicked(type: BoosterType): void {
        if (this._clickHandler) {
            this._clickHandler(type);
        }
    }
}