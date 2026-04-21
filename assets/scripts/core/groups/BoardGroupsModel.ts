import { GroupInfo } from "./GroupFinder";

export class BoardGroupsModel {
    private readonly _groups: GroupInfo[];
    private readonly _groupByTileId: Map<number, GroupInfo>;
    private readonly _groupByCellIndex: Map<number, GroupInfo>;
    private readonly _boardWidth: number;

    constructor(groups: GroupInfo[], boardWidth: number) {
        this._groups = groups.slice();
        this._boardWidth = boardWidth;
        this._groupByTileId = new Map<number, GroupInfo>();
        this._groupByCellIndex = new Map<number, GroupInfo>();

        this.buildLookups();
    }

    public getAllGroups(): GroupInfo[] {
        return this._groups.slice();
    }

    public hasAnyGroups(): boolean {
        return this._groups.length > 0;
    }

    public getGroupByTileId(tileId: number): GroupInfo | null {
        return this._groupByTileId.get(tileId) ?? null;
    }

    public getGroupByCell(x: number, y: number): GroupInfo | null {
        return this.getGroupByCellIndex(this.toCellIndex(x, y));
    }

    public getGroupByCellIndex(cellIndex: number): GroupInfo | null {
        return this._groupByCellIndex.get(cellIndex) ?? null;
    }

    public hasGroupForTileId(tileId: number): boolean {
        return this._groupByTileId.has(tileId);
    }

    public hasGroupForCell(x: number, y: number): boolean {
        return this._groupByCellIndex.has(this.toCellIndex(x, y));
    }

    private buildLookups(): void {
        for (const group of this._groups) {
            for (const tile of group.tiles) {
                this._groupByTileId.set(tile.tileId, group);
                this._groupByCellIndex.set(this.toCellIndex(tile.x, tile.y), group);
            }
        }
    }

    private toCellIndex(x: number, y: number): number {
        return y * this._boardWidth + x;
    }
}