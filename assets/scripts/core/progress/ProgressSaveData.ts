import { ActiveLevelSaveData } from "./ActiveLevelSaveData";
import { BoosterInventorySaveData } from "./BoosterInventorySaveData";

export interface ProgressSaveData {
    version: number;
    completedLevelsCount: number;
    boosters: BoosterInventorySaveData;
    activeLevel: ActiveLevelSaveData | null;
}