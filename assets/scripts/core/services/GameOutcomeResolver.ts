import { GameStatus } from "../models/GameStatus";
import { TileType } from "../models/TileType";
import { LevelSession } from "../session/LevelSession";

export class GameOutcomeResolver {
    public resolveStatus(session: LevelSession): GameStatus {
        const gameState = session.getGameStateModel();

        if (gameState.score >= gameState.targetScore) {
            return GameStatus.Won;
        }

        if (!this.hasAvailableActions(session)) {
            return GameStatus.Lost;
        }

        if (gameState.movesLeft <= 0) {
            return GameStatus.Lost;
        }

        return GameStatus.Playing;
    }

    private hasAvailableActions(session: LevelSession): boolean {
        const boardGroupsModel = session.getBoardGroupsModel();

        if (boardGroupsModel && boardGroupsModel.hasAnyGroups()) {
            return true;
        }

        return this.hasAnyBooster(session);
    }

    private hasAnyBooster(session: LevelSession): boolean {
        const boardModel = session.getBoardModel();
        let hasBooster = false;

        boardModel.forEachTile((tile) => {
            if (tile === null) {
                return;
            }

            if (tile.type !== TileType.Normal) {
                hasBooster = true;
            }
        });

        return hasBooster;
    }
}