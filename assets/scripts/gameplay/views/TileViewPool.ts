import TileView from "./TileView";

export class TileViewPool {
    private readonly _tilePrefab: cc.Prefab;
    private readonly _parent: cc.Node;
    private readonly _pool: TileView[] = [];

    constructor(tilePrefab: cc.Prefab, parent: cc.Node) {
        this._tilePrefab = tilePrefab;
        this._parent = parent;
    }

    public get(): TileView {
        const tileView = this._pool.pop();

        if (tileView) {
            tileView.node.active = true;
            return tileView;
        }

        const tileNode = cc.instantiate(this._tilePrefab);
        tileNode.parent = this._parent;
        tileNode.setAnchorPoint(0, 0);

        return tileNode.getComponent(TileView);
    }

    public release(tileView: TileView): void {
        tileView.prepareForPool();
        this._pool.push(tileView);
    }

    public releaseMany(tileViews: TileView[]): void {
        for (const tileView of tileViews) {
            this.release(tileView);
        }
    }

    public clear(): void {
        for (const tileView of this._pool) {
            tileView.node.destroy();
        }

        this._pool.length = 0;
    }
}