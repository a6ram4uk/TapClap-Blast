export interface LevelData {
    id: string;
    width: number;
    height: number;

    moves: number;
    targetScore: number;

    /**
     * Visible board cells in visual order:
     * left-to-right, top-to-bottom.
     */
    cells: number[];

    /**
     * Hidden refill cells in visual order:
     * left-to-right, top-to-bottom.
     */
    supply: number[];

    /**
     * Normal tile color ids allowed for random refill.
     * Example: [1, 2, 3, 4]
     */
    randomTileTypes: number[];
}