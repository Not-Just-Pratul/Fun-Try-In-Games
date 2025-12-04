import { CollectibleBase } from './CollectibleBase';
import { CollectibleType } from '@game-types/collectible';
import { Vector2D } from '@game-types/common';

/**
 * LoreCollectible - Story content collectible
 */
export class LoreCollectible extends CollectibleBase {
  private readonly title: string;
  private readonly description: string;
  private readonly storyContent: string;

  constructor(
    id: string,
    position: Vector2D,
    title: string,
    description: string,
    storyContent: string
  ) {
    super(id, CollectibleType.LORE_ITEM, position);
    this.title = title;
    this.description = description;
    this.storyContent = storyContent;
  }

  protected onCollect(): void {
    // Lore collection behavior - add to story engine
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string {
    return this.description;
  }

  getStoryContent(): string {
    return this.storyContent;
  }

  getData(): any {
    return {
      ...super.getData(),
      title: this.title,
      description: this.description,
      storyContent: this.storyContent
    };
  }
}
