import { LevelsCatalogData } from "../data/LevelsCatalogData";

export class LevelSequenceResolver {
    public resolveCurrentLevelId(catalog: LevelsCatalogData, completedLevelsCount: number): string {
        if (!catalog.levelsQueue || catalog.levelsQueue.length === 0) {
            throw new Error("[LevelSequenceResolver] levelsQueue is empty.");
        }

        if (!Number.isInteger(completedLevelsCount) || completedLevelsCount < 0) {
            throw new Error(
                `[LevelSequenceResolver] completedLevelsCount must be a non-negative integer. Got: ${completedLevelsCount}`
            );
        }

        const index = completedLevelsCount % catalog.levelsQueue.length;
        return catalog.levelsQueue[index];
    }
}