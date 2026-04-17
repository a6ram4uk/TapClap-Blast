import { LevelsCatalogData } from "../data/LevelsCatalogData";
import { LevelValidator } from "../services/LevelValidator";

export class LevelsCatalogLoader {
    private readonly _validator: LevelValidator;

    constructor(validator: LevelValidator) {
        this._validator = validator;
    }

    public loadCatalog(resourcePath: string = "configs/levelsCatalog"): Promise<LevelsCatalogData> {
        return new Promise((resolve, reject) => {
            cc.resources.load(resourcePath, cc.JsonAsset, (error: Error | null, asset: cc.JsonAsset) => {
                if (error) {
                    reject(error);
                    return;
                }

                const data = asset.json as LevelsCatalogData;
                this._validator.validateCatalog(data);
                resolve(data);
            });
        });
    }
}