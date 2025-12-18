
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CheckCircleIcon, SparklesIcon } from './icons';

interface SubProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

const SubscriptionModal: React.FC<SubProps> = ({ isOpen, onClose, onSubscribe }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ y: 50, scale: 0.9 }} animate={{ y: 0, scale: 1 }} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"><XIcon className="w-6 h-6"/></button>
            
            <div className="h-32 bg-gradient-to-r from-brand-terracotta to-brand-honey flex items-center justify-center">
              <SparklesIcon className="w-16 h-16 text-white/50 animate-spin-slow" />
            </div>

            <div className="p-8 text-center">
              <h2 className="text-3xl font-serif font-bold text-gray-800 mb-2">fitCREATE Pro</h2>
              <p className="text-gray-500 mb-6 italic">You look amazing. Want to look even better?</p>
              
              <ul className="text-left space-y-3 mb-8">
                {['Unlimited Try-Ons', 'Full Body Sculpting Lab', 'AI Beauty Retouching', 'All Premium Templates', 'Ad-Free Experience'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                    <CheckCircleIcon className="w-5 h-5 text-brand-sage" /> {f}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => { onSubscribe(); onClose(); }}
                className="w-full bg-brand-terracotta text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-brand-terracotta/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Join for $2.99 / Week
              </button>
              <p className="text-[10px] text-gray-400 mt-4">Cancel anytime. Free trial expired? Continue slaying with Pro.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;
