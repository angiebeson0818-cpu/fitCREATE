/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloudIcon, CameraIcon } from './icons';
import { Compare } from './ui/compare';
import { generateModelImage } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage } from '../lib/utils';
import CameraCapture from './CameraCapture';

interface StartScreenProps {
  onModelFinalized: (modelUrl: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onModelFinalized }) => {
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setUserImageUrl(dataUrl);
        setIsGenerating(true);
        setGeneratedModelUrl(null);
        setError(null);
        try {
            const result = await generateModelImage(file);
            setGeneratedModelUrl(result);
        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Failed to create model'));
            setUserImageUrl(null);
        } finally {
            setIsGenerating(false);
        }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };
  
  const handleCapture = useCallback((blob: Blob) => {
    const file = new File([blob], `capture-${Date.now()}.jpeg`, { type: 'image/jpeg' });
    handleFileSelect(file);
    setIsCameraOpen(false); // Close camera and proceed to compare screen
  }, [handleFileSelect]);


  const reset = () => {
    setUserImageUrl(null);
    setGeneratedModelUrl(null);
    setIsGenerating(false);
    setError(null);
  };

  const screenVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <AnimatePresence mode="wait">
       {isCameraOpen ? (
        <motion.div
          key="camera-capture"
          className="w-full h-full"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <CameraCapture onCapture={handleCapture} onCancel={() => setIsCameraOpen(false)} />
        </motion.div>
      ) : !userImageUrl ? (
        <motion.div
          key="uploader"
          className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="max-w-lg">
              <div className="flex flex-col items-center lg:items-start mb-6">
                {/* Logo Placeholder - User to replace src with actual logo path */}
                <img src="/logo.png" alt="fitCREATE Logo" className="h-24 w-auto object-contain mb-4" />
                <h1 className="text-6xl md:text-7xl font-serif font-bold text-brand-terracotta leading-tight">
                    fitCREATE
                </h1>
                <h2 className="text-2xl md:text-3xl font-serif text-brand-sage mt-2">
                    Brand Color &amp; Style Guide
                </h2>
              </div>
              
              <p className="mt-4 text-lg text-gray-700">
                Upload a photo and experience your visual identity coming to life. Our AI creates your personal model, ready to style with your unique look.
              </p>
              <hr className="my-8 border-brand-sand" />
              <div className="flex flex-col items-center lg:items-start w-full gap-3">
                  <div className="flex flex-col sm:flex-row items-center lg:items-start w-full gap-3">
                    <label htmlFor="image-upload-start" className="w-full sm:w-auto flex-grow relative flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-brand-terracotta rounded-md cursor-pointer group hover:bg-brand-honey transition-colors shadow-md hover:shadow-lg border border-brand-terracotta">
                      <UploadCloudIcon className="w-5 h-5 mr-3" />
                      Upload Photo
                    </label>
                    <input id="image-upload-start" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" onChange={handleFileChange} />
                    <button onClick={() => setIsCameraOpen(true)} className="w-full sm:w-auto flex-grow relative flex items-center justify-center px-8 py-3 text-base font-semibold text-brand-terracotta bg-white border border-brand-sand rounded-md cursor-pointer group hover:bg-brand-warm transition-colors shadow-sm">
                        <CameraIcon className="w-5 h-5 mr-3" />
                        Use Camera
                    </button>
                  </div>
                <p className="text-brand-sage text-sm italic">Designed with love by angieCREATEs</p>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
            <div className="p-2 border border-brand-sand rounded-[1.2rem]">
                <Compare
                firstImage="/fitcreatehome page.jpg"
                secondImage="/fitcreatehomepagepic.png"
                slideMode="drag"
                className="w-full max-w-sm aspect-[2/3] rounded-2xl bg-brand-cream"
                />
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="compare"
          className="w-full max-w-6xl mx-auto h-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="md:w-1/2 flex-shrink-0 flex flex-col items-center md:items-start">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-terracotta leading-tight">
                The New You
              </h1>
              <p className="mt-2 text-md text-brand-sage">
                Drag the slider to see your transformation.
              </p>
            </div>
            
            {isGenerating && (
              <div className="flex items-center gap-3 text-lg text-brand-honey font-serif mt-6">
                <Spinner />
                <span>Generating your model...</span>
              </div>
            )}

            {error && 
              <div className="text-center md:text-left text-brand-rose max-w-md mt-6">
                <p className="font-semibold">Generation Failed</p>
                <p className="text-sm mb-4">{error}</p>
                <button onClick={reset} className="text-sm font-semibold text-brand-terracotta hover:underline">Try Again</button>
              </div>
            }
            
            <AnimatePresence>
              {generatedModelUrl && !isGenerating && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col sm:flex-row items-center gap-4 mt-8"
                >
                  <button 
                    onClick={reset}
                    className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-brand-terracotta bg-white border border-brand-sand rounded-md cursor-pointer hover:bg-brand-warm transition-colors"
                  >
                    Use Different Photo
                  </button>
                  <button 
                    onClick={() => onModelFinalized(generatedModelUrl)}
                    className="w-full sm:w-auto relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-brand-terracotta rounded-md cursor-pointer group hover:bg-brand-honey transition-colors shadow-md"
                  >
                    Proceed to Styling &rarr;
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="md:w-1/2 w-full flex items-center justify-center">
            <div 
              className={`relative rounded-[1.25rem] p-2 transition-all duration-700 ease-in-out ${isGenerating ? 'border-2 border-brand-sand animate-pulse' : 'border border-brand-sand'}`}
            >
              <Compare
                firstImage={userImageUrl}
                secondImage={generatedModelUrl ?? userImageUrl}
                slideMode="drag"
                className="w-[280px] h-[420px] sm:w-[320px] sm:h-[480px] lg:w-[400px] lg:h-[600px] rounded-2xl bg-brand-cream"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StartScreen;