export interface BoardLayoutResult {
    scale: number;
    positionX: number;
    positionY: number;
    boardPixelWidth: number;
    boardPixelHeight: number;
}

export class BoardLayoutResolver {
    private readonly _topPadding: number;
    private readonly _bottomPadding: number;
    private readonly _sidePadding: number;
    private readonly _hudReservedHeight: number;

    constructor(
        topPadding: number = 40,
        bottomPadding: number = 40,
        sidePadding: number = 40,
        hudReservedHeight: number = 220
    ) {
        this._topPadding = topPadding;
        this._bottomPadding = bottomPadding;
        this._sidePadding = sidePadding;
        this._hudReservedHeight = hudReservedHeight;
    }

    public resolve(
        screenWidth: number,
        screenHeight: number,
        boardWidthInCells: number,
        boardHeightInCells: number,
        cellSize: number
    ): BoardLayoutResult {
        const boardPixelWidth = boardWidthInCells * cellSize;
        const boardPixelHeight = boardHeightInCells * cellSize;

        const availableWidth = screenWidth - this._sidePadding * 2;
        const availableHeight =
            screenHeight - this._topPadding - this._bottomPadding - this._hudReservedHeight;

        const scaleX = availableWidth / boardPixelWidth;
        const scaleY = availableHeight / boardPixelHeight;
        const scale = Math.min(scaleX, scaleY, 1);

        const scaledWidth = boardPixelWidth * scale;
        const scaledHeight = boardPixelHeight * scale;

        const positionX = -scaledWidth * 0.5;
        const gameplayAreaTop = screenHeight * 0.5 - this._topPadding - this._hudReservedHeight;
        const gameplayAreaBottom = -screenHeight * 0.5 + this._bottomPadding;
        const gameplayAreaCenterY = (gameplayAreaTop + gameplayAreaBottom) * 0.5;

        const positionY = gameplayAreaCenterY - scaledHeight * 0.5;

        return {
            scale,
            positionX,
            positionY,
            boardPixelWidth,
            boardPixelHeight,
        };
    }
}