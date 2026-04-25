import { BoardActionResult } from "../actions/BoardActionResult";
import { BoosterCreateStep } from "../actions/BoosterCreateStep";
import { DestroyStep } from "../actions/DestroyStep";
import { FallMove, FallStep } from "../actions/FallStep";
import { RefillStep } from "../actions/RefillStep";
import { TileData } from "../models/TileData";
import { TileType } from "../models/TileType";
import { LevelSession } from "../session/LevelSession";
import { RandomProvider } from "../utils/RandomProvider";
import { BoosterCreateResolver } from "./BoosterCreateResolver";
import { RefillTileFactory } from "./RefillTileFactory";
import { TileIdProvider } from "./TileIdProvider";

interface VirtualTilePosition {
    tileId: number;
    x: number;
    y: number;
}

export class BoardService {
    private static readonly SCORE_PER_TILE: number = 10;

    private readonly _tileIdProvider: TileIdProvider;
    private readonly _refillTileFactory: RefillTileFactory;
    private readonly _boosterCreateResolver: BoosterCreateResolver;

    constructor() {
        this._tileIdProvider = new TileIdProvider();
        this._refillTileFactory = new RefillTileFactory(
            new RandomProvider(),
            this._tileIdProvider
        );
        this._boosterCreateResolver = new BoosterCreateResolver();
    }

    public resolveNormalClick(session: LevelSession, tileId: number): BoardActionResult {
        const boardModel = session.getBoardModel();
        const boardGroupsModel = session.getBoardGroupsModel();

        if (!boardGroupsModel) {
            return BoardActionResult.invalid(tileId);
        }

        this._tileIdProvider.syncFromBoard(boardModel);

        let clickedTile: TileData | null = null;

        boardModel.forEachTile((tile) => {
            if (tile !== null && tile.tileId === tileId) {
                clickedTile = tile;
            }
        });

        if (clickedTile === null) {
            return BoardActionResult.invalid(tileId);
        }

        if (clickedTile.type !== TileType.Normal) {
            return BoardActionResult.invalid(tileId);
        }

        const group = boardGroupsModel.getGroupByTileId(tileId);
        if (group === null) {
            return BoardActionResult.invalid(tileId);
        }

        const groupSize = group.tiles.length;
        const scoreGained = groupSize * BoardService.SCORE_PER_TILE;
        const destroyStep = new DestroyStep(group.tiles.map(tile => tile.tileId));

        const boosterCreateStep = this._boosterCreateResolver.resolveFromNormalGroup(
            clickedTile,
            group.tiles,
            this._tileIdProvider
        );

        const fallStep = this.buildFallStepAfterDestroyAndBooster(
            session,
            destroyStep,
            boosterCreateStep
        );

        const refillStep = this.buildRefillStepAfterDestroyBoosterAndFall(
            session,
            destroyStep,
            boosterCreateStep,
            fallStep
        );

        return BoardActionResult.validNormalClick(
            tileId,
            groupSize,
            scoreGained,
            destroyStep,
            boosterCreateStep,
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

    public applyBoosterCreateStep(session: LevelSession, boosterCreateStep: BoosterCreateStep): void {
        const boardModel = session.getBoardModel();

        for (const booster of boosterCreateStep.boosters) {
            const tile = new TileData(
                booster.tileId,
                booster.x,
                booster.y,
                booster.type,
                booster.color
            );

            boardModel.setTile(booster.x, booster.y, tile);
        }
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

    private buildFallStepAfterDestroyAndBooster(
        session: LevelSession,
        destroyStep: DestroyStep,
        boosterCreateStep: BoosterCreateStep | null
    ): FallStep | null {
        const boardModel = session.getBoardModel();
        const width = boardModel.getWidth();
        const height = boardModel.getHeight();
        const destroySet = new Set<number>(destroyStep.tileIds);

        const boosterPositions = this.getBoosterVirtualPositions(boosterCreateStep);
        const allMoves: FallMove[] = [];

        for (let x = 0; x < width; x++) {
            const survivors: VirtualTilePosition[] = [];

            for (let y = 0; y < height; y++) {
                const tile = boardModel.getTile(x, y);

                if (tile === null) {
                    continue;
                }

                if (destroySet.has(tile.tileId)) {
                    continue;
                }

                survivors.push({
                    tileId: tile.tileId,
                    x: tile.x,
                    y: tile.y,
                });
            }

            for (const booster of boosterPositions) {
                if (booster.x === x) {
                    survivors.push(booster);
                }
            }

            survivors.sort((a, b) => a.y - b.y);

            for (let targetY = 0; targetY < survivors.length; targetY++) {
                const virtualTile = survivors[targetY];

                if (virtualTile.y === targetY) {
                    continue;
                }

                allMoves.push({
                    tileId: virtualTile.tileId,
                    fromX: virtualTile.x,
                    fromY: virtualTile.y,
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

    private buildRefillStepAfterDestroyBoosterAndFall(
        session: LevelSession,
        destroyStep: DestroyStep,
        boosterCreateStep: BoosterCreateStep | null,
        fallStep: FallStep | null
    ): RefillStep | null {
        const boardModel = session.getBoardModel();
        const refillSource = session.getRefillSource();
        const width = boardModel.getWidth();
        const height = boardModel.getHeight();

        const destroySet = new Set<number>(destroyStep.tileIds);
        const finalOccupied = new Set<number>();

        boardModel.forEachTile((tile, x, y) => {
            if (tile === null) {
                return;
            }

            if (destroySet.has(tile.tileId)) {
                return;
            }

            finalOccupied.add(boardModel.toIndex(x, y));
        });

        if (boosterCreateStep !== null) {
            for (const booster of boosterCreateStep.boosters) {
                finalOccupied.add(boardModel.toIndex(booster.x, booster.y));
            }
        }

        if (fallStep !== null) {
            for (const move of fallStep.moves) {
                finalOccupied.delete(boardModel.toIndex(move.fromX, move.fromY));
                finalOccupied.add(boardModel.toIndex(move.toX, move.toY));
            }
        }

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

    private getBoosterVirtualPositions(boosterCreateStep: BoosterCreateStep | null): VirtualTilePosition[] {
        if (boosterCreateStep === null) {
            return [];
        }

        return boosterCreateStep.boosters.map(booster => ({
            tileId: booster.tileId,
            x: booster.x,
            y: booster.y,
        }));
    }
}