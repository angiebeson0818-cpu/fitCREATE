/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { SavedOutfit } from '../types';
import { XIcon } from './icons';
import { AnimatePresence, motion } from 'framer-motion';

interface SavedOutfitsPanelProps {
  savedOutfits: SavedOutfit[];
  onLoadOutfit: (outfit: SavedOutfit) => void;
  onDeleteOutfit: (outfitId: string) => void;
  isLoading: boolean;
}

const SavedOutfitsPanel: React.FC<SavedOutfitsPanelProps> = ({ savedOutfits, onLoadOutfit, onDeleteOutfit, isLoading }) => {
  return (
    <div className="pt-6 border-t border-gray-400/50">
      <h2 className="text-xl font-serif tracking-wider text-gray-800 mb-3">Saved Outfits</h2>
      {savedOutfits.length === 0 ? (
        <p className="text-center text-sm text-gray-500 pt-2">Your saved outfits will appear here.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <AnimatePresence>
            {savedOutfits.map((outfit) => (
              <motion.div
                key={outfit.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="relative group aspect-square"
              >
                <button
                  onClick={() => onLoadOutfit(outfit)}
                  disabled={isLoading}
                  className="w-full h-full border rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  aria-label={`Load outfit ${outfit.name}`}
                >
                  <img src={outfit.thumbnailUrl} alt={outfit.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold text-center p-1">{outfit.name}</p>
                  </div>
                </button>
                <button
                  onClick={() => onDeleteOutfit(outfit.id)}
                  disabled={isLoading}
                  className="absolute top-1 right-1 z-10 p-1 bg-white/60 rounded-full text-gray-700 hover:bg-white hover:text-red-600 transition-all scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 disabled:opacity-0"
                  aria-label={`Delete outfit ${outfit.name}`}
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default SavedOutfitsPanel;