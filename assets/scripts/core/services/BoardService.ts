import { BoardActionResult } from "../actions/BoardActionResult";
import { BoosterCreateStep } from "../actions/BoosterCreateStep";
import { DestroyStep } from "../actions/DestroyStep";
import { FallMove, FallStep } from "../actions/FallStep";
import { RefillStep } from "../actions/RefillStep";
import { TileData } from "../models/TileData";
import { TileType } from "../models/TileType";
import { LevelSession } from "../session/LevelSession";
import { RandomProvider } from "../utils/RandomProvider";
import { BlastChainResolver } from "./BlastChainResolver";
import { BoosterActivationResolver } from "./BoosterActivationResolver";
import { BoosterCreateResolver } from "./BoosterCreateResolver";
import { RefillTileFactory } from "./RefillTileFactory";
import { TileIdProvider } from "./TileIdProvider";
import { BoosterType } from "../boosters/BoosterType";

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
    private readonly _blastChainResolver: BlastChainResolver;

    constructor() {
        this._tileIdProvider = new TileIdProvider();
        this._refillTileFactory = new RefillTileFactory(
            new RandomProvider(),
            this._tileIdProvider
        );
        this._boosterCreateResolver = new BoosterCreateResolver();

        const boosterActivationResolver = new BoosterActivationResolver();
        this._blastChainResolver = new BlastChainResolver(boosterActivationResolver);
    }

    public resolveClick(session: LevelSession, tileId: number): BoardActionResult {
        const clickedTile = this.findTileById(session, tileId);

        if (clickedTile === null) {
            return BoardActionResult.invalid(tileId);
        }

        if (clickedTile.type === TileType.Normal) {
            return this.resolveNormalClick(session, clickedTile);
        }

        return this.resolveBoosterClick(session, clickedTile);
    }

    public resolveBoosterToolUse(
        session: LevelSession,
        boosterType: BoosterType,
        targetTileIds: number[]
    ): BoardActionResult {
        if (boosterType === BoosterType.Bomb) {
            return this.resolveBombToolUse(session, targetTileIds);
        }

        return BoardActionResult.invalid(targetTileIds.length > 0 ? targetTileIds[0] : -1);
    }

    private resolveNormalClick(session: LevelSession, clickedTile: TileData): BoardActionResult {
        const boardModel = session.getBoardModel();
        const boardGroupsModel = session.getBoardGroupsModel();

        if (!boardGroupsModel) {
            return BoardActionResult.invalid(clickedTile.tileId);
        }

        this._tileIdProvider.syncFromBoard(boardModel);

        const group = boardGroupsModel.getGroupByTileId(clickedTile.tileId);
        if (group === null) {
            return BoardActionResult.invalid(clickedTile.tileId);
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
            [destroyStep],
            boosterCreateStep
        );

        const refillStep = this.buildRefillStepAfterDestroyBoosterAndFall(
            session,
            [destroyStep],
            boosterCreateStep,
            fallStep
        );

        return BoardActionResult.validNormalClick(
            clickedTile.tileId,
            groupSize,
            scoreGained,
            destroyStep,
            boosterCreateStep,
            fallStep,
            refillStep
        );
    }

    private resolveBoosterClick(session: LevelSession, clickedTile: TileData): BoardActionResult {
        const boardModel = session.getBoardModel();

        this._tileIdProvider.syncFromBoard(boardModel);

        const destroySteps = this._blastChainResolver.resolveFromInitialBoosters(
            [clickedTile],
            boardModel
        );

        if (destroySteps.length === 0) {
            return BoardActionResult.invalid(clickedTile.tileId);
        }

        const destroyedCount = this.countDestroyedTiles(destroySteps);
        const scoreGained = destroyedCount * BoardService.SCORE_PER_TILE;

        const fallStep = this.buildFallStepAfterDestroyAndBooster(
            session,
            destroySteps,
            null
        );

        const refillStep = this.buildRefillStepAfterDestroyBoosterAndFall(
            session,
            destroySteps,
            null,
            fallStep
        );

        return BoardActionResult.validBoosterClick(
            clickedTile.tileId,
            scoreGained,
            destroySteps,
            fallStep,
            refillStep
        );
    }

    private resolveBombToolUse(session: LevelSession, targetTileIds: number[]): BoardActionResult {
        if (targetTileIds.length !== 1) {
            return BoardActionResult.invalid(-1);
        }

        const targetTile = this.findTileById(session, targetTileIds[0]);

        if (targetTile === null) {
            return BoardActionResult.invalid(targetTileIds[0]);
        }

        const boardModel = session.getBoardModel();
        this._tileIdProvider.syncFromBoard(boardModel);

        const affectedNormalTileIds: number[] = [];
        const affectedBoosters: TileData[] = [];

        for (let y = targetTile.y - 1; y <= targetTile.y + 1; y++) {
            for (let x = targetTile.x - 1; x <= targetTile.x + 1; x++) {
                if (!boardModel.isInside(x, y)) {
                    continue;
                }

                const tile = boardModel.getTile(x, y);
                if (tile === null) {
                    continue;
                }

                if (tile.type === TileType.Normal) {
                    affectedNormalTileIds.push(tile.tileId);
                } else {
                    affectedBoosters.push(tile);
                }
            }
        }

        const destroySteps: DestroyStep[] = [];

        if (affectedNormalTileIds.length > 0) {
            destroySteps.push(new DestroyStep(affectedNormalTileIds));
        }

        const chainSteps = this._blastChainResolver.resolveFromInitialBoosters(
            affectedBoosters,
            boardModel
        );

        for (const step of chainSteps) {
            destroySteps.push(step);
        }

        if (destroySteps.length === 0) {
            return BoardActionResult.invalid(targetTile.tileId);
        }

        const destroyedCount = this.countDestroyedTiles(destroySteps);
        const scoreGained = destroyedCount * BoardService.SCORE_PER_TILE;

        const fallStep = this.buildFallStepAfterDestroyAndBooster(
            session,
            destroySteps,
            null
        );

        const refillStep = this.buildRefillStepAfterDestroyBoosterAndFall(
            session,
            destroySteps,
            null,
            fallStep
        );

        return BoardActionResult.validBoosterClick(
            targetTile.tileId,
            scoreGained,
            destroySteps,
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
        destroySteps: DestroyStep[],
        boosterCreateStep: BoosterCreateStep | null
    ): FallStep | null {
        const boardModel = session.getBoardModel();
        const width = boardModel.getWidth();
        const destroySet = this.createDestroySet(destroySteps);

        const boosterPositions = this.getBoosterVirtualPositions(boosterCreateStep);
        const allMoves: FallMove[] = [];

        for (let x = 0; x < width; x++) {
            const survivors: VirtualTilePosition[] = [];

            for (let y = 0; y < boardModel.getHeight(); y++) {
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
        destroySteps: DestroyStep[],
        boosterCreateStep: BoosterCreateStep | null,
        fallStep: FallStep | null
    ): RefillStep | null {
        const boardModel = session.getBoardModel();
        const refillSource = session.getRefillSource();
        const width = boardModel.getWidth();
        const height = boardModel.getHeight();

        const destroySet = this.createDestroySet(destroySteps);
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

    private createDestroySet(destroySteps: DestroyStep[]): Set<number> {
        const destroySet = new Set<number>();

        for (const step of destroySteps) {
            for (const tileId of step.tileIds) {
                destroySet.add(tileId);
            }
        }

        return destroySet;
    }

    private countDestroyedTiles(destroySteps: DestroyStep[]): number {
        return this.createDestroySet(destroySteps).size;
    }

    private findTileById(session: LevelSession, tileId: number): TileData | null {
        const boardModel = session.getBoardModel();
        let result: TileData | null = null;

        boardModel.forEachTile((tile) => {
            if (tile !== null && tile.tileId === tileId) {
                result = tile;
            }
        });

        return result;
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