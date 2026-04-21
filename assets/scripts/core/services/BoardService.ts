import { BoardActionResult } from "../actions/BoardActionResult";
import { LevelSession } from "../session/LevelSession";
import { TileType } from "../models/TileType";

export class BoardService {
    private static readonly SCORE_PER_TILE: number = 10;

    public resolveNormalClick(session: LevelSession, tileId: number): BoardActionResult {
        const boardModel = session.getBoardModel();
        const boardGroupsModel = session.getBoardGroupsModel();

        if (!boardGroupsModel) {
            return BoardActionResult.invalid(tileId);
        }

        let clickedTileType: TileType | null = null;

        boardModel.forEachTile((tile) => {
            if (tile !== null && tile.tileId === tileId) {
                clickedTileType = tile.type;
            }
        });

        if (clickedTileType === null) {
            return BoardActionResult.invalid(tileId);
        }

        if (clickedTileType !== TileType.Normal) {
            return BoardActionResult.invalid(tileId);
        }

        const group = boardGroupsModel.getGroupByTileId(tileId);
        if (group === null) {
            return BoardActionResult.invalid(tileId);
        }

        const groupSize = group.tiles.length;
        const scoreGained = groupSize * BoardService.SCORE_PER_TILE;

        return BoardActionResult.validNormalClick(
            tileId,
            groupSize,
            scoreGained
        );
    }
}