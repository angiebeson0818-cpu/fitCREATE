
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { SparklesIcon, MagicWandIcon, FaceIcon, BodyIcon, PhotoIcon } from './icons';
import { generateAIRetouch, applyMakeupSet, sculptBody, applyStyleTemplate } from '../services/geminiService';
import Spinner from './Spinner';

interface ProToolsProps {
  isPro: boolean;
  currentImageUrl: string | null;
  onApply: (url: string) => void;
  onProRequired: () => void;
}

const ProToolsPanel: React.FC<ProToolsProps> = ({ isPro, currentImageUrl, onApply, onProRequired }) => {
  const [activeTab, setActiveTab] = useState<'retouch' | 'makeup' | 'sculpt' | 'template'>('retouch');
  const [loading, setLoading] = useState(false);

  const tools = {
    retouch: ['Skin Smoothing', 'Teeth Whitening', 'Blemish Removal', 'Anti-Wrinkle', 'Eye Brighten'],
    makeup: ['Glamorous', 'Bare Faced', 'Rocker Chick', 'Tan Girl', 'Classic Red'],
    sculpt: ['Manual Slimmer', 'Muscle Definition', 'Plumper', 'Sculptor'],
    template: ['Cyberpunk', 'Anime', 'Medieval', 'Starbucks Time', 'Polaroid Kiss', 'Christmas', 'Birthday']
  };

  const handleToolClick = async (option: string) => {
    if (!isPro) {
      onProRequired();
      return;
    }
    if (!currentImageUrl) return;

    setLoading(true);
    try {
      let result = '';
      if (activeTab === 'retouch') result = await generateAIRetouch(currentImageUrl, option);
      else if (activeTab === 'makeup') result = await applyMakeupSet(currentImageUrl, option);
      else if (activeTab === 'sculpt') result = await sculptBody(currentImageUrl, option);
      else result = await applyStyleTemplate(currentImageUrl, option);
      onApply(result);
    } catch (err) {
      alert("Pro generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-brand-warm to-white p-4 rounded-2xl border border-brand-sand/50 shadow-sm relative overflow-hidden">
      {!isPro && <div className="absolute top-2 right-2 rotate-12 bg-yellow-400 text-[10px] font-bold px-2 py-1 rounded shadow-sm">PRO</div>}
      
      <div className="flex items-center gap-2 mb-4">
        <SparklesIcon className="w-5 h-5 text-brand-honey" />
        <h3 className="font-serif font-bold text-gray-800">Pro Style Lab</h3>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'retouch', icon: MagicWandIcon },
          { id: 'makeup', icon: FaceIcon },
          { id: 'sculpt', icon: BodyIcon },
          { id: 'template', icon: PhotoIcon }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 flex justify-center p-2 rounded-md transition-all ${activeTab === t.id ? 'bg-white shadow-sm text-brand-terracotta' : 'text-gray-400'}`}
          >
            <t.icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tools[activeTab].map(option => (
          <button
            key={option}
            onClick={() => handleToolClick(option)}
            disabled={loading}
            className="text-[11px] font-semibold p-2 bg-white border border-gray-200 rounded-lg hover:border-brand-sand transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Spinner size="small" /> : option}
          </button>
        ))}
      </div>
      
      {loading && (
        <div className="mt-3 text-center animate-pulse">
            <p className="text-[10px] text-brand-sage italic font-serif">Crafting your new look... Pure slay magic in progress.</p>
        </div>
      )}
    </div>
  );
};

export default ProToolsPanel;
