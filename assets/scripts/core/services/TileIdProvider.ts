import { BoardModel } from "../models/BoardModel";

export class TileIdProvider {
    private _nextTileId: number = 1;

    public syncFromBoard(boardModel: BoardModel): void {
        let maxId = 0;

        boardModel.forEachTile((tile) => {
            if (tile !== null && tile.tileId > maxId) {
                maxId = tile.tileId;
            }
        });

        if (this._nextTileId <= maxId) {
            this._nextTileId = maxId + 1;
        }
    }

    public getNextId(): number {
        return this._nextTileId++;
    }
}