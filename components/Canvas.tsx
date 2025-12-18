
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';

const QUOTES = [
    "That outfit slays.",
    "You're killing it!",
    "Slay the day.",
    "Happy Monday, you look amazing.",
    "Pure style energy.",
    "Iconic look loading...",
    "Fit of the century!"
];

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  onUndo: () => void;
  canUndo: boolean;
  isLoading: boolean;
  loadingMessage: string;
}

const Canvas: React.FC<CanvasProps> = ({ displayImageUrl, isLoading, loadingMessage }) => {
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    if (isLoading) {
      setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    }
  }, [isLoading]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative group">
      {/* Action buttons removed from here as they are now in the App header */}

      <div className="relative w-full h-full max-w-[600px] flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        <AnimatePresence mode="wait">
            {displayImageUrl ? (
                <motion.img
                    key={displayImageUrl}
                    src={displayImageUrl}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-2xl shadow-2xl bg-white/40"
                    style={{ maxHeight: 'calc(100vh - 180px)' }} // Ensure image fits between header and footer
                />
            ) : (
                <div className="w-full h-full bg-brand-sand/5 rounded-3xl border-2 border-dashed border-brand-sand/20 flex items-center justify-center">
                    <Spinner />
                </div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {isLoading && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-white/60 backdrop-blur-lg flex flex-col items-center justify-center z-20 rounded-2xl"
                >
                    <Spinner />
                    <div className="mt-8 text-center px-8">
                        <motion.p 
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="text-2xl sm:text-3xl font-serif font-bold text-brand-terracotta italic mb-2"
                        >
                          "{quote}"
                        </motion.p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">{loadingMessage}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-2 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
         <p className="text-[9px] font-bold text-brand-sage uppercase tracking-widest bg-white/40 backdrop-blur-sm inline-block px-3 py-1 rounded-full">fitCREATE Studio HD</p>
      </div>
    </div>
  );
};

export default Canvas;
