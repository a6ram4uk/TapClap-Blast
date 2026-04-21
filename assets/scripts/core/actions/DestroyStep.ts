export class DestroyStep {
    public readonly tileIds: number[];

    constructor(tileIds: number[]) {
        this.tileIds = tileIds.slice();
    }

    public isEmpty(): boolean {
        return this.tileIds.length === 0;
    }
}