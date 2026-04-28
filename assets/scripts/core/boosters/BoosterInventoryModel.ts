import { BoosterType } from "./BoosterType";

export class BoosterInventoryModel {
    private readonly _counts: Map<BoosterType, number> = new Map<BoosterType, number>();

    constructor(bombCount: number, teleportCount: number) {
        this._counts.set(BoosterType.Bomb, bombCount);
        this._counts.set(BoosterType.Teleport, teleportCount);
    }

    public getCount(type: BoosterType): number {
        return this._counts.get(type) ?? 0;
    }

    public hasAny(type: BoosterType): boolean {
        return this.getCount(type) > 0;
    }

    public consume(type: BoosterType): void {
        const current = this.getCount(type);

        if (current <= 0) {
            throw new Error(`[BoosterInventoryModel] Cannot consume booster: ${type}`);
        }

        this._counts.set(type, current - 1);
    }

    public setCount(type: BoosterType, count: number): void {
        this._counts.set(type, Math.max(0, count));
    }
}