export class RandomProvider {
    // фиксированный seed (потом можно вынести наружу)
    private _seed: number = 123456789;

    // LCG генератор
    private next(): number {
        this._seed = (this._seed * 1664525 + 1013904223) % 4294967296;
        return this._seed;
    }

    private nextFloat(): number {
        return this.next() / 4294967296;
    }

    public nextInt(min: number, max: number): number {
        return Math.floor(this.nextFloat() * (max - min + 1)) + min;
    }

    public pickFromArray<T>(items: T[]): T {
        if (!items || items.length === 0) {
            throw new Error("[RandomProvider] Cannot pick from empty array");
        }

        const index = this.nextInt(0, items.length - 1);
        return items[index];
    }
}