import { BoardModel } from "../models/BoardModel";
import { TileCodeMapper } from "../models/TileCodeMapper";
import { TileData } from "../models/TileData";

export class BoardSnapshotFactory {
    private readonly _tileCodeMapper: TileCodeMapper = new TileCodeMapper();

    public createSnapshot(boardModel: BoardModel): number[] {
        const width = boardModel.getWidth();
        const height = boardModel.getHeight();
        const result: number[] = [];

        for (let rowFromTop = 0; rowFromTop < height; rowFromTop++) {
            const y = height - 1 - rowFromTop;

            for (let x = 0; x < width; x++) {
                const tile = boardModel.getTile(x, y);
                result.push(this._tileCodeMapper.encode(tile));
            }
        }

        return result;
    }

    public createBoardFromSnapshot(width: number, height: number, cells: number[]): BoardModel {
        if (cells.length !== width * height) {
            throw new Error(
                `[BoardSnapshotFactory] Invalid snapshot cells length: ${cells.length}, expected ${width * height}`
            );
        }

        const board = new BoardModel(width, height);
        let nextTileId = 1;

        for (let visualIndex = 0; visualIndex < cells.length; visualIndex++) {
            const code = cells[visualIndex];

            if (this._tileCodeMapper.isEmpty(code)) {
                continue;
            }

            const rowFromTop = Math.floor(visualIndex / width);
            const x = visualIndex % width;
            const y = height - 1 - rowFromTop;

            const decoded = this._tileCodeMapper.decode(code);

            const tile = new TileData(
                nextTileId++,
                x,
                y,
                decoded.type,
                decoded.color
            );

            board.setTile(x, y, tile);
        }

        return board;
    }
}