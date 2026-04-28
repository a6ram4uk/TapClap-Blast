export interface BoardLayoutResult {
    scale: number;
    positionX: number;
    positionY: number;
    boardPixelWidth: number;
    boardPixelHeight: number;
}

export class BoardLayoutResolver {
    private readonly _sidePadding: number;
    private readonly _topPadding: number;
    private readonly _bottomPadding: number;

    constructor(
        sidePadding: number = 20,
        topPadding: number = 20,
        bottomPadding: number = 20
    ) {
        this._sidePadding = sidePadding;
        this._topPadding = topPadding;
        this._bottomPadding = bottomPadding;
    }

    public resolve(
        areaWidth: number,
        areaHeight: number,
        boardWidthInCells: number,
        boardHeightInCells: number,
        cellSize: number
    ): BoardLayoutResult {
        const boardPixelWidth = boardWidthInCells * cellSize;
        const boardPixelHeight = boardHeightInCells * cellSize;

        const availableWidth = areaWidth - this._sidePadding * 2;
        const availableHeight = areaHeight - this._topPadding - this._bottomPadding;

        const scaleX = availableWidth / boardPixelWidth;
        const scaleY = availableHeight / boardPixelHeight;
        const scale = Math.min(scaleX, scaleY, 1);

        const scaledWidth = boardPixelWidth * scale;
        const scaledHeight = boardPixelHeight * scale;

        return {
            scale,
            positionX: (areaWidth - scaledWidth) * 0.5,
            positionY: (areaHeight - scaledHeight) * 0.5,
            boardPixelWidth,
            boardPixelHeight,
        };
    }
}