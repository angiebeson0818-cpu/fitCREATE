
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobeModal';
import OutfitStack from './components/OutfitStack';
import ProToolsPanel from './components/ProToolsPanel';
import SubscriptionModal from './components/SubscriptionModal';
import LoadingOverlay from './components/LoadingOverlay';
import { generateVirtualTryOnImage, generateVirtualTryOnFromReference } from './services/geminiService';
import { OutfitLayer, WardrobeItem, UserStatus } from './types';
import { CoinIcon, SparklesIcon, UploadCloudIcon, RotateCcwIcon, UndoIcon } from './components/icons';
import { defaultWardrobe } from './wardrobe';
import Footer from './components/Footer';
import { getFriendlyErrorMessage } from './lib/utils';
import TapToEarnGame from './components/TapToEarnGame';

const POSE_INSTRUCTIONS = ["Full frontal view", "3/4 view", "Side profile", "Walking", "Leaning"];

const App: React.FC = () => {
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultWardrobe);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  
  const [status, setStatus] = useState<UserStatus>(() => {
    const saved = localStorage.getItem('fitcreate_status');
    const today = new Date().toDateString();
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.lastUsedDate !== today) {
        return { ...parsed, freeUsesToday: 0, lastUsedDate: today };
      }
      return parsed;
    }
    return { isPro: false, freeUsesToday: 0, lastUsedDate: today };
  });

  useEffect(() => {
    localStorage.setItem('fitcreate_status', JSON.stringify(status));
  }, [status]);

  const displayImageUrl = useMemo(() => {
    if (outfitHistory.length === 0) return modelImageUrl;
    const currentLayer = outfitHistory[currentOutfitIndex];
    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    return (currentLayer?.poseImages[poseInstruction] ?? Object.values(currentLayer?.poseImages || {})[0]) || modelImageUrl;
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, modelImageUrl]);

  const activeGarmentIds = useMemo(() => 
    outfitHistory.slice(0, currentOutfitIndex + 1).map(layer => layer.garment?.id).filter(Boolean) as string[], 
    [outfitHistory, currentOutfitIndex]
  );

  const checkUsage = () => {
    if (status.isPro) return true;
    if (status.freeUsesToday >= 1) {
      setIsSubModalOpen(true);
      return false;
    }
    return true;
  };

  const handleDownload = async () => {
    if (!displayImageUrl) return;
    if (!status.isPro) {
      setIsAdLoading(true);
      await new Promise(res => setTimeout(res, 5000));
      setIsAdLoading(false);
    }
    const link = document.createElement('a');
    link.href = displayImageUrl;
    link.download = `fitCREATE-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleModelFinalized = (url: string) => {
    setModelImageUrl(url);
    setOutfitHistory([{ garment: null, poseImages: { [POSE_INSTRUCTIONS[0]]: url } }]);
  };

  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem) => {
    if (!displayImageUrl || isLoading || !checkUsage()) return;
    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Styling your look... Slay energy loading!`);
    try {
      const newImageUrl = await generateVirtualTryOnImage(displayImageUrl, garmentFile);
      const newLayer: OutfitLayer = { 
        garment: garmentInfo, 
        poseImages: { [POSE_INSTRUCTIONS[currentPoseIndex]]: newImageUrl } 
      };
      setOutfitHistory(prev => [...prev.slice(0, currentOutfitIndex + 1), newLayer]);
      setCurrentOutfitIndex(prev => prev + 1);
      if (!status.isPro) setStatus(prev => ({ ...prev, freeUsesToday: prev.freeUsesToday + 1 }));
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Style session failed'));
    } finally {
      setIsLoading(false);
    }
  }, [displayImageUrl, isLoading, status, currentPoseIndex, currentOutfitIndex]);

  const handleReferenceSelect = useCallback(async (referenceFile: File) => {
    if (!displayImageUrl || isLoading || !checkUsage()) return;
    setIsLoading(true);
    setLoadingMessage(`Detecting style vibes...`);
    try {
      const newImageUrl = await generateVirtualTryOnFromReference(displayImageUrl, referenceFile);
      const refItem: WardrobeItem = { id: `ref-${Date.now()}`, name: `Vibe Check`, url: URL.createObjectURL(referenceFile), category: 'custom' };
      setOutfitHistory(prev => [...prev.slice(0, currentOutfitIndex + 1), { garment: refItem, poseImages: { [POSE_INSTRUCTIONS[currentPoseIndex]]: newImageUrl } }]);
      setCurrentOutfitIndex(prev => prev + 1);
      if (!status.isPro) setStatus(prev => ({ ...prev, freeUsesToday: prev.freeUsesToday + 1 }));
    } catch (err) { setError(getFriendlyErrorMessage(err, 'Style transfer failed')); }
    finally { setIsLoading(false); }
  }, [displayImageUrl, isLoading, status, currentPoseIndex, currentOutfitIndex]);

  return (
    <div className="font-sans min-h-screen bg-brand-warm flex flex-col overflow-hidden">
      <TapToEarnGame isLoading={isLoading} loadingMessage={loadingMessage} coinBalance={coinBalance} onUpdateBalance={setCoinBalance} />
      <SubscriptionModal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} onSubscribe={() => setStatus(s => ({ ...s, isPro: true }))} />
      
      <AnimatePresence>
        {isAdLoading && <LoadingOverlay message="Watching Ad to Unlock Download... Slay the wait!" />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!modelImageUrl ? (
          <StartScreen onModelFinalized={handleModelFinalized} />
        ) : (
          <div className="relative flex flex-col h-screen overflow-hidden">
            {/* Unified Fixed Header */}
            <header className="flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-brand-sand/30 p-4 z-40 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="bg-brand-warm px-3 py-1.5 rounded-full border border-brand-sand/30 flex items-center gap-2">
                  <CoinIcon className="w-4 h-4 text-yellow-500" />
                  <span className="font-mono font-bold text-gray-700 text-sm">{coinBalance.toLocaleString()}</span>
                </div>
                <button 
                  onClick={handleDownload}
                  className="bg-brand-terracotta text-white px-3 py-1.5 rounded-full flex items-center gap-2 hover:bg-brand-honey transition-colors shadow-sm"
                >
                  <UploadCloudIcon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Save Look</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setModelImageUrl(null)} 
                  className="bg-white border border-gray-200 text-gray-700 font-bold py-1.5 px-3 rounded-full hover:bg-gray-50 transition-all text-[10px] uppercase tracking-widest"
                >
                  <RotateCcwIcon className="w-3 h-3 mr-1 inline" /> Reset
                </button>
                <button 
                  onClick={() => setCurrentOutfitIndex(prev => Math.max(0, prev - 1))} 
                  disabled={currentOutfitIndex === 0 || isLoading}
                  className="bg-white border border-gray-200 text-gray-700 font-bold py-1.5 px-3 rounded-full hover:bg-gray-50 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50"
                >
                  <UndoIcon className="w-3 h-3 mr-1 inline" /> Undo
                </button>
                {!status.isPro && (
                  <button onClick={() => setIsSubModalOpen(true)} className="bg-gradient-to-r from-brand-honey to-brand-terracotta text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-md animate-pulse">
                    <SparklesIcon className="w-3 h-3" /> Go Pro
                  </button>
                )}
              </div>
            </header>

            <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
              <div className="flex-grow flex flex-col items-center justify-center p-4 bg-brand-warm relative overflow-hidden">
                <Canvas 
                  displayImageUrl={displayImageUrl} 
                  isLoading={isLoading} 
                  loadingMessage={loadingMessage} 
                  // Buttons are now in the header, passing empty functions to keep prop interface if needed
                  canUndo={false} 
                  onUndo={() => {}}
                  onStartOver={() => {}}
                />
              </div>

              <aside className="w-full md:w-[400px] h-1/2 md:h-full bg-white/95 backdrop-blur-md border-t md:border-t-0 md:border-l border-brand-sand/40 flex flex-col overflow-hidden">
                <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-8 custom-scrollbar">
                  <OutfitStack outfitHistory={outfitHistory.slice(0, currentOutfitIndex + 1)} onSaveOutfit={() => alert('Outfit saved to lookbook!')} canSave={true} onRemoveLastGarment={() => setCurrentOutfitIndex(prev => prev - 1)} />
                  
                  <ProToolsPanel 
                    isPro={status.isPro} 
                    currentImageUrl={displayImageUrl} 
                    onApply={(newUrl) => {
                       setOutfitHistory(prev => [...prev.slice(0, currentOutfitIndex + 1), { garment: null, poseImages: { [POSE_INSTRUCTIONS[currentPoseIndex]]: newUrl } }]);
                       setCurrentOutfitIndex(prev => prev + 1);
                    }}
                    onProRequired={() => setIsSubModalOpen(true)}
                  />

                  <WardrobePanel 
                    onGarmentSelect={handleGarmentSelect} 
                    onReferenceSelect={handleReferenceSelect} 
                    activeGarmentIds={activeGarmentIds} 
                    isLoading={isLoading} 
                    wardrobe={wardrobe} 
                  />
                </div>
              </aside>
            </main>
          </div>
        )}
      </AnimatePresence>
      <Footer isOnDressingScreen={!!modelImageUrl} />
    </div>
  );
};

export default App;
