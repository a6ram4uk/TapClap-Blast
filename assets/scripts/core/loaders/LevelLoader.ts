import { LevelData } from "../data/LevelData";
import { LevelValidator } from "../services/LevelValidator";

export class LevelLoader {
    private readonly _validator: LevelValidator;

    constructor(validator: LevelValidator) {
        this._validator = validator;
    }

    public loadLevel(levelId: string): Promise<LevelData> {
        const path = this.buildLevelPath(levelId);

        return new Promise((resolve, reject) => {
            cc.resources.load(path, cc.JsonAsset, (error: Error | null, asset: cc.JsonAsset) => {
                if (error) {
                    reject(error);
                    return;
                }

                const data = asset.json as LevelData;
                this._validator.validateLevel(data);
                resolve(data);
            });
        });
    }

    private buildLevelPath(levelId: string): string {
        return `levels/${levelId}`;
    }
}