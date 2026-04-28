import { LevelData } from "../data/LevelData";
import { BoardModel } from "../models/BoardModel";
import { TileCodeMapper } from "../models/TileCodeMapper";
import { TileData } from "../models/TileData";

export class BoardFactory {
    private readonly _tileCodeMapper: TileCodeMapper = new TileCodeMapper();

    private _nextTileId: number = 1;

    public createInitialBoardFromLevelData(levelData: LevelData): BoardModel {
        const width = levelData.width;
        const height = levelData.height;
        const board = new BoardModel(width, height);

        const cells = levelData.cells;

        for (let visualIndex = 0; visualIndex < cells.length; visualIndex++) {
            const code = cells[visualIndex];

            if (this._tileCodeMapper.isEmpty(code)) {
                continue;
            }

            const rowFromTop = Math.floor(visualIndex / width);
            const x = visualIndex % width;
            const y = height - 1 - rowFromTop;

            const tile = this.createTileFromCode(x, y, code);
            board.setTile(x, y, tile);
        }

        return board;
    }

    private createTileFromCode(x: number, y: number, code: number): TileData {
        const decoded = this._tileCodeMapper.decode(code);

        return new TileData(
            this._nextTileId++,
            x,
            y,
            decoded.type,
            decoded.color
        );
    }
}