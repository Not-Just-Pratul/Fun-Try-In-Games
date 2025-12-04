export interface Memory {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  cinematicData?: CinematicData;
}

export interface CinematicData {
  duration: number;
  scenes: Scene[];
}

export interface Scene {
  text: string;
  duration: number;
  imageUrl?: string;
}

export interface LoreItem {
  id: string;
  title: string;
  description: string;
  unlockCondition: string;
}
