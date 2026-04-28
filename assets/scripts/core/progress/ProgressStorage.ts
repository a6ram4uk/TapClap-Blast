import { ProgressSaveData } from "./ProgressSaveData";

export class ProgressStorage {
    private static readonly STORAGE_KEY = "tapclap_blast_progress";
    private static readonly VERSION = 0;
    private static readonly BOOSTER_BOMB_INIT_COUNT = 100;

    public load(): ProgressSaveData {
        const raw = cc.sys.localStorage.getItem(ProgressStorage.STORAGE_KEY);

        if (!raw) {
            return this.createDefault();
        }

        try {
            const parsed = JSON.parse(raw) as ProgressSaveData;

            if (parsed.version !== ProgressStorage.VERSION) {
                return this.createDefault();
            }

            return {
                version: ProgressStorage.VERSION,
                completedLevelsCount: Math.max(0, parsed.completedLevelsCount || 0),
                boosters: {
                    bomb: parsed.boosters ? Math.max(0, parsed.boosters.bomb || 0) : ProgressStorage.BOOSTER_BOMB_INIT_COUNT,
                    teleport: parsed.boosters ? Math.max(0, parsed.boosters.teleport || 0) : 0,
                },
                activeLevel: parsed.activeLevel || null,
            };
        } catch (error) {
            cc.warn("[ProgressStorage] Failed to parse save. Using default.", error);
            return this.createDefault();
        }
    }

    public save(data: ProgressSaveData): void {
        cc.sys.localStorage.setItem(
            ProgressStorage.STORAGE_KEY,
            JSON.stringify(data)
        );
    }

    public clear(): void {
        cc.sys.localStorage.removeItem(ProgressStorage.STORAGE_KEY);
    }

    private createDefault(): ProgressSaveData {
        return {
            version: ProgressStorage.VERSION,
            completedLevelsCount: 0,
            boosters: {
                bomb: ProgressStorage.BOOSTER_BOMB_INIT_COUNT,
                teleport: 0,
            },
            activeLevel: null,
        };
    }
}