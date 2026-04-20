import { BoardModel } from "../models/BoardModel";
import { TileData } from "../models/TileData";
import { TileType } from "../models/TileType";
import { LevelSession } from "../session/LevelSession";

export class BoardFactory {
    private _nextTileId: number = 1;

    public createInitialBoard(levelSession: LevelSession): BoardModel {
        const width = levelSession.getWidth();
        const height = levelSession.getHeight();
        const board = new BoardModel(width, height);

        const cells = levelSession.getStartCells();

        for (let visualIndex = 0; visualIndex < cells.length; visualIndex++) {
            const code = cells[visualIndex];

            if (code === 0) {
                continue;
            }

            const rowFromTop = Math.floor(visualIndex / width);
            const x = visualIndex % width;
            const y = height - 1 - rowFromTop;

            const tile = this.createTileFromLevelCode(x, y, code);
            board.setTile(x, y, tile);
        }

        return board;
    }

    private createTileFromLevelCode(x: number, y: number, code: number): TileData {
        return new TileData(
            this._nextTileId++,
            x,
            y,
            TileType.Normal,
            code
        );
    }
}