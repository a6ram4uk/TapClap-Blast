export class RandomProvider {
    public pickFromArray<T>(items: T[]): T {
        if (items.length === 0) {
            throw new Error("[RandomProvider] Cannot pick from an empty array.");
        }

        const index = this.nextInt(0, items.length - 1);
        return items[index];
    }

    public nextInt(minInclusive: number, maxInclusive: number): number {
        if (minInclusive > maxInclusive) {
            throw new Error(
                `[RandomProvider] Invalid range: minInclusive=${minInclusive}, maxInclusive=${maxInclusive}`
            );
        }

        const range = maxInclusive - minInclusive + 1;
        return minInclusive + Math.floor(Math.random() * range);
    }
}