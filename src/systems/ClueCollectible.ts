import { CollectibleBase } from './CollectibleBase';
import { CollectibleType } from '@game-types/collectible';
import { Vector2D } from '@game-types/common';

/**
 * ClueCollectible - Provides puzzle hints when collected
 */
export class ClueCollectible extends CollectibleBase {
  private readonly hintText: string;
  private readonly puzzleId: string;

  constructor(id: string, position: Vector2D, hintText: string, puzzleId: string) {
    super(id, CollectibleType.CLUE, position);
    this.hintText = hintText;
    this.puzzleId = puzzleId;
  }

  protected onCollect(): void {
    // Clue collection behavior - emit event or trigger hint display
  }

  getHintText(): string {
    return this.hintText;
  }

  getPuzzleId(): string {
    return this.puzzleId;
  }

  getData(): any {
    return {
      ...super.getData(),
      hintText: this.hintText,
      puzzleId: this.puzzleId
    };
  }
}
