import { BoardActionResult } from "../actions/BoardActionResult";
import { DestroyStep } from "../actions/DestroyStep";
import { FallMove, FallStep } from "../actions/FallStep";
import { RefillStep } from "../actions/RefillStep";
import { TileData } from "../models/TileData";
import { TileType } from "../models/TileType";
import { LevelSession } from "../session/LevelSession";
import { RandomProvider } from "../utils/RandomProvider";
import { RefillTileFactory } from "./RefillTileFactory";

export class BoardService {
    private static readonly SCORE_PER_TILE: number = 10;

    private readonly _refillTileFactory: RefillTileFactory;

    constructor() {
        this._refillTileFactory = new RefillTileFactory(new RandomProvider());
    }

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
        const fallStep = this.buildFallStepAfterDestroy(session, destroyStep);
        const refillStep = this.buildRefillStepAfterDestroyAndFall(session, destroyStep, fallStep);

        return BoardActionResult.validNormalClick(
            tileId,
            groupSize,
            scoreGained,
            destroyStep,
            fallStep,
            refillStep
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

    public applyRefillStep(session: LevelSession, refillStep: RefillStep): void {
        const boardModel = session.getBoardModel();

        for (const spawn of refillStep.spawns) {
            const tile = new TileData(
                spawn.tileId,
                spawn.x,
                spawn.y,
                TileType.Normal,
                spawn.color
            );

            boardModel.setTile(spawn.x, spawn.y, tile);
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

    private buildRefillStepAfterDestroyAndFall(
        session: LevelSession,
        destroyStep: DestroyStep,
        fallStep: FallStep | null
    ): RefillStep | null {
        const boardModel = session.getBoardModel();
        const refillSource = session.getRefillSource();
        const width = boardModel.getWidth();
        const height = boardModel.getHeight();

        const destroySet = new Set<number>(destroyStep.tileIds);
        const finalOccupied = new Set<number>();

        // 1. Сначала все существующие тайлы, которые не уничтожаются
        boardModel.forEachTile((tile, x, y) => {
            if (tile === null) {
                return;
            }

            if (destroySet.has(tile.tileId)) {
                return;
            }

            finalOccupied.add(boardModel.toIndex(x, y));
        });

        // 2. Потом переносим занятые клетки по FallStep в их итоговые позиции
        if (fallStep !== null) {
            for (const move of fallStep.moves) {
                finalOccupied.delete(boardModel.toIndex(move.fromX, move.fromY));
                finalOccupied.add(boardModel.toIndex(move.toX, move.toY));
            }
        }

        const existingTileIds: number[] = [];
        boardModel.forEachTile((tile) => {
            if (tile !== null) {
                existingTileIds.push(tile.tileId);
            }
        });
        this._refillTileFactory.syncNextTileIdFromBoard(existingTileIds);

        const spawns = [];

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const index = boardModel.toIndex(x, y);

                if (finalOccupied.has(index)) {
                    continue;
                }

                const created = this._refillTileFactory.createForCell(refillSource, x, y);
                spawns.push(created.spawn);
                finalOccupied.add(index);
            }
        }

        if (spawns.length === 0) {
            return null;
        }

        return new RefillStep(spawns);
    }
}