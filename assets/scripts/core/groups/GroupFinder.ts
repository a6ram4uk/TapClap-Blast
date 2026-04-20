import { BoardModel } from "../models/BoardModel";
import { TileData } from "../models/TileData";
import { TileType } from "../models/TileType";

export interface GroupInfo {
    groupId: number;
    tiles: TileData[];
}

export class GroupFinder {
    public findAllGroups(board: BoardModel): GroupInfo[] {
        const width = board.getWidth();
        const height = board.getHeight();

        const visited = new Array<boolean>(width * height).fill(false);
        const groups: GroupInfo[] = [];

        let groupIdCounter = 1;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = board.toIndex(x, y);

                if (visited[index]) {
                    continue;
                }

                const tile = board.getTile(x, y);

                if (tile === null) {
                    visited[index] = true;
                    continue;
                }

                if (tile.type !== TileType.Normal) {
                    visited[index] = true;
                    continue;
                }

                const groupTiles = this.collectGroup(board, x, y, visited);

                if (groupTiles.length >= 2) {
                    groups.push({
                        groupId: groupIdCounter++,
                        tiles: groupTiles,
                    });
                }
            }
        }

        return groups;
    }

    private collectGroup(
        board: BoardModel,
        startX: number,
        startY: number,
        visited: boolean[]
    ): TileData[] {
        const width = board.getWidth();

        const startTile = board.getTile(startX, startY);
        if (!startTile) {
            return [];
        }

        const color = startTile.color;

        const stack: Array<{ x: number; y: number }> = [];
        const result: TileData[] = [];

        stack.push({ x: startX, y: startY });

        while (stack.length > 0) {
            const { x, y } = stack.pop()!;

            const index = board.toIndex(x, y);

            if (visited[index]) {
                continue;
            }

            const tile = board.getTile(x, y);

            if (tile === null) {
                visited[index] = true;
                continue;
            }

            if (tile.type !== TileType.Normal) {
                visited[index] = true;
                continue;
            }

            if (tile.color !== color) {
                continue;
            }

            visited[index] = true;
            result.push(tile);

            // соседи (крест)
            this.tryPushNeighbor(board, x + 1, y, visited, color, stack);
            this.tryPushNeighbor(board, x - 1, y, visited, color, stack);
            this.tryPushNeighbor(board, x, y + 1, visited, color, stack);
            this.tryPushNeighbor(board, x, y - 1, visited, color, stack);
        }

        return result;
    }

    private tryPushNeighbor(
        board: BoardModel,
        x: number,
        y: number,
        visited: boolean[],
        color: number | null,
        stack: Array<{ x: number; y: number }>
    ): void {
        if (!board.isInside(x, y)) {
            return;
        }

        const index = board.toIndex(x, y);

        if (visited[index]) {
            return;
        }

        const tile = board.getTile(x, y);

        if (tile === null) {
            return;
        }

        if (tile.type !== TileType.Normal) {
            return;
        }

        if (tile.color !== color) {
            return;
        }

        stack.push({ x, y });
    }
}