export class BoardSelectionController {
    private _requiredCount: number = 0;
    private _selectedTileIds: number[] = [];
    private _resolve: ((tileIds: number[]) => void) | null = null;
    private _isSelecting: boolean = false;

    public isSelecting(): boolean {
        return this._isSelecting;
    }

    public selectTiles(requiredCount: number): Promise<number[]> {
        if (requiredCount <= 0) {
            throw new Error(`[BoardSelectionController] Invalid required count: ${requiredCount}`);
        }

        this.cancel();

        this._requiredCount = requiredCount;
        this._selectedTileIds = [];
        this._isSelecting = true;

        return new Promise(resolve => {
            this._resolve = resolve;
        });
    }

    public acceptTile(tileId: number): void {
        if (!this._isSelecting) {
            return;
        }

        if (this._selectedTileIds.indexOf(tileId) >= 0) {
            return;
        }

        this._selectedTileIds.push(tileId);

        if (this._selectedTileIds.length >= this._requiredCount) {
            const result = this._selectedTileIds.slice();
            const resolve = this._resolve;

            this.reset();

            if (resolve) {
                resolve(result);
            }
        }
    }

    public cancel(): void {
        if (!this._isSelecting) {
            return;
        }

        this.reset();
    }

    private reset(): void {
        this._requiredCount = 0;
        this._selectedTileIds = [];
        this._resolve = null;
        this._isSelecting = false;
    }
}