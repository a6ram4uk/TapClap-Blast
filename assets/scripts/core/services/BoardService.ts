import { BoardActionResult } from "../actions/BoardActionResult";
import { DestroyStep } from "../actions/DestroyStep";
import { FallMove, FallStep } from "../actions/FallStep";
import { TileData } from "../models/TileData";
import { TileType } from "../models/TileType";
import { LevelSession } from "../session/LevelSession";

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
        const destroyStep = new DestroyStep(group.tiles.map(tile => tile.tileId));

        // Строим FallStep на модели после destroy,
        // но пока не применяем изменения к реальной доске здесь.
        const fallStep = this.buildFallStepAfterDestroy(session, destroyStep);

        return BoardActionResult.validNormalClick(
            tileId,
            groupSize,
            scoreGained,
            destroyStep,
            fallStep
        );
    }

    public applyDestroyStep(session: LevelSession, destroyStep: DestroyStep): void {
        const boardModel = session.getBoardModel();
        const destroySet = new Set<number>(destroyStep.tileIds);

        boardModel.forEachTile((tile, x, y) => {
            if (tile === null) {
                return;
            }

            if (!destroySet.has(tile.tileId)) {
                return;
            }

            boardModel.setTile(x, y, null);
        });
    }

    public applyFallStep(session: LevelSession, fallStep: FallStep): void {
        const boardModel = session.getBoardModel();

        for (const move of fallStep.moves) {
            const tile = boardModel.getTile(move.fromX, move.fromY);

            if (tile === null) {
                continue;
            }

            boardModel.setTile(move.fromX, move.fromY, null);
            boardModel.setTile(move.toX, move.toY, tile);
        }
    }

    private buildFallStepAfterDestroy(session: LevelSession, destroyStep: DestroyStep): FallStep | null {
        const boardModel = session.getBoardModel();
        const width = boardModel.getWidth();
        const height = boardModel.getHeight();
        const destroySet = new Set<number>(destroyStep.tileIds);

        const allMoves: FallMove[] = [];

        for (let x = 0; x < width; x++) {
            const survivors: TileData[] = [];

            for (let y = 0; y < height; y++) {
                const tile = boardModel.getTile(x, y);

                if (tile === null) {
                    continue;
                }

                if (destroySet.has(tile.tileId)) {
                    continue;
                }

                survivors.push(tile);
            }

            for (let targetY = 0; targetY < survivors.length; targetY++) {
                const tile = survivors[targetY];

                if (tile.y === targetY) {
                    continue;
                }

                allMoves.push({
                    tileId: tile.tileId,
                    fromX: tile.x,
                    fromY: tile.y,
                    toX: x,
                    toY: targetY,
                });
            }
        }

        if (allMoves.length === 0) {
            return null;
        }

        return new FallStep(allMoves);
    }
}