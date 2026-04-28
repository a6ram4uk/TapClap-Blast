import { LevelData } from "../data/LevelData";
import { LevelsCatalogData } from "../data/LevelsCatalogData";

export class LevelValidator {
    public validateCatalog(catalog: LevelsCatalogData): void {
        if (!catalog) {
            throw new Error("[LevelValidator] Catalog is null or undefined.");
        }

        if (!Array.isArray(catalog.levelsQueue)) {
            throw new Error("[LevelValidator] levelsQueue must be an array.");
        }

        if (catalog.levelsQueue.length === 0) {
            throw new Error("[LevelValidator] levelsQueue must not be empty.");
        }

        for (let i = 0; i < catalog.levelsQueue.length; i++) {
            const levelId = catalog.levelsQueue[i];

            if (typeof levelId !== "string" || levelId.length === 0) {
                throw new Error(`[LevelValidator] Invalid level id at index ${i}: ${levelId}`);
            }
        }
    }

    public validateLevel(levelData: LevelData): void {
        if (!levelData) {
            throw new Error("[LevelValidator] LevelData is null or undefined.");
        }

        if (!levelData.id || typeof levelData.id !== "string") {
            throw new Error("[LevelValidator] id must be a non-empty string.");
        }

        this.validatePositiveInt(levelData.width, "width");
        this.validatePositiveInt(levelData.height, "height");
        this.validateNonNegativeInt(levelData.moves, "moves");
        this.validateNonNegativeInt(levelData.targetScore, "targetScore");

        if (!Array.isArray(levelData.cells)) {
            throw new Error("[LevelValidator] cells must be an array.");
        }

        if (!Array.isArray(levelData.supply)) {
            throw new Error("[LevelValidator] supply must be an array.");
        }

        if (!Array.isArray(levelData.randomTileTypes)) {
            throw new Error("[LevelValidator] randomTileTypes must be an array.");
        }

        const expectedCellsCount = levelData.width * levelData.height;
        if (levelData.cells.length !== expectedCellsCount) {
            throw new Error(
                `[LevelValidator] cells length mismatch. Expected ${expectedCellsCount}, got ${levelData.cells.length}.`
            );
        }

        if (levelData.supply.length % levelData.width !== 0) {
            throw new Error(
                `[LevelValidator] supply length must be divisible by width. width=${levelData.width}, supply.length=${levelData.supply.length}.`
            );
        }

        if (levelData.randomTileTypes.length === 0) {
            throw new Error("[LevelValidator] randomTileTypes must not be empty.");
        }

        const allowedNormalColors = new Set<number>();

        for (let i = 0; i < levelData.randomTileTypes.length; i++) {
            const color = levelData.randomTileTypes[i];

            if (!Number.isInteger(color) || color <= 0) {
                throw new Error(`[LevelValidator] randomTileTypes[${i}] must be a positive integer. Got: ${color}`);
            }

            if (allowedNormalColors.has(color)) {
                throw new Error(`[LevelValidator] randomTileTypes contains duplicate value: ${color}`);
            }

            allowedNormalColors.add(color);
        }

        for (let i = 0; i < levelData.cells.length; i++) {
            const value = levelData.cells[i];

            if (!Number.isInteger(value) || value < 0) {
                throw new Error(`[LevelValidator] cells[${i}] must be an integer >= 0. Got: ${value}`);
            }
        }

        for (let i = 0; i < levelData.supply.length; i++) {
            const value = levelData.supply[i];

            if (!Number.isInteger(value) || value <= 0) {
                throw new Error(`[LevelValidator] supply[${i}] must be a positive integer. Got: ${value}`);
            }

            if (!allowedNormalColors.has(value)) {
                throw new Error(
                    `[LevelValidator] supply[${i}] contains color ${value}, which is absent in randomTileTypes.`
                );
            }
        }

        this.validateLevelHasAnyPossibleAction(levelData);
    }

    private validateLevelHasAnyPossibleAction(levelData: LevelData): void {
        const width = levelData.width;
        const height = levelData.height;

        for (let visualIndex = 0; visualIndex < levelData.cells.length; visualIndex++) {
            const value = levelData.cells[visualIndex];
            if (value === 0) {
                continue;
            }

            const rowFromTop = Math.floor(visualIndex / width);
            const x = visualIndex % width;
            const y = height - 1 - rowFromTop;

            if (this.hasSameColorNeighbor(levelData, x, y, value)) {
                return;
            }
        }

        throw new Error(
            `[LevelValidator] Level ${levelData.id} starts without any valid normal group of size >= 2. Fix level data.`
        );
    }

    private hasSameColorNeighbor(levelData: LevelData, x: number, y: number, color: number): boolean {
        return (
            this.getCell(levelData, x - 1, y) === color ||
            this.getCell(levelData, x + 1, y) === color ||
            this.getCell(levelData, x, y - 1) === color ||
            this.getCell(levelData, x, y + 1) === color
        );
    }

    private getCell(levelData: LevelData, x: number, y: number): number {
        if (x < 0 || x >= levelData.width || y < 0 || y >= levelData.height) {
            return -1;
        }

        const rowFromTop = levelData.height - 1 - y;
        const index = rowFromTop * levelData.width + x;
        return levelData.cells[index];
    }

    private validatePositiveInt(value: number, fieldName: string): void {
        if (!Number.isInteger(value) || value <= 0) {
            throw new Error(`[LevelValidator] ${fieldName} must be a positive integer. Got: ${value}`);
        }
    }

    private validateNonNegativeInt(value: number, fieldName: string): void {
        if (!Number.isInteger(value) || value < 0) {
            throw new Error(`[LevelValidator] ${fieldName} must be a non-negative integer. Got: ${value}`);
        }
    }
}