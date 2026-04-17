import { BoardDataSnapshot } from "./BoardDataSnapshot";

export interface GameProgressData {
    completedLevelsCount: number;
    boardDataSnapshot: BoardDataSnapshot | null;
}