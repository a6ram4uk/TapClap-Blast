import { ActiveLevelSaveData } from "./ActiveLevelSaveData";

export interface ProgressSaveData {
    version: number;
    completedLevelsCount: number;
    activeLevel: ActiveLevelSaveData | null;
}