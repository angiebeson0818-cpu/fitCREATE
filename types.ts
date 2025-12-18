
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
  category?: 'top' | 'bottom' | 'dress' | 'outerwear' | 'custom' | string;
  tags?: string[];
}

export interface OutfitLayer {
  garment: WardrobeItem | null;
  poseImages: Record<string, string>;
}

export interface SavedOutfit {
  id: string;
  name: string;
  layers: OutfitLayer[];
  thumbnailUrl: string;
}

export type ProTool = 'retouch' | 'makeup' | 'sculpt' | 'template';

export interface UserStatus {
  isPro: boolean;
  freeUsesToday: number;
  lastUsedDate: string;
}
