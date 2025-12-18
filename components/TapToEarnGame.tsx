
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CoinIcon } from './icons';

interface TapToEarnGameProps {
  isLoading: boolean;
  loadingMessage: string;
  coinBalance: number;
  onUpdateBalance: (newBalance: number) => void;
}

// Visual assets for particles (emojis) - Updated to be more fashion-centric
const FLYING_ITEMS = [
  '💄', '💋', '👠', '🎀', '🍬', '🍭', '🍫', '🧁', '👛', '💅', '💍', '💖', '🍪', '🍬', '🌸', '✨'
];

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  content: string;
  angle: number; // For radial movement
  velocity: number;
}

const TapToEarnGame: React.FC<TapToEarnGameProps> = ({ isLoading, loadingMessage, coinBalance, onUpdateBalance }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameScore, setGameScore] = useState(0);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Timer
  useEffect(() => {
    if (!isLoading) {
      setParticles([]);
      setTimeLeft(60);
      setGameScore(0);
      setIsGameFinished(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsGameFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Audio setup for "Pop" sound
  const playPopSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    // Frequency sweep for a "bloop" sound
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  }, []);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (isGameFinished) return;

    // 1. Play Sound
    playPopSound();

    // 2. Logic Update
    const newBalance = coinBalance + 1;
    setGameScore(prev => prev + 1);
    onUpdateBalance(newBalance);

    // 3. Reward Check
    if (newBalance >= 5000) {
        // We use a timeout to let the UI render the 5000 first, then alert
        setTimeout(() => {
            alert('Congratulations, you earned a free image creation credit!');
            onUpdateBalance(newBalance - 5000);
        }, 100);
    }

    // 4. Visuals (Spawn Particles)
    // Get tap coordinates - center of coin for explosion effect
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Spawn 4-6 particles per tap for richness
    const newParticles: Particle[] = [];
    const count = Math.floor(Math.random() * 3) + 4; 

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * 2 * Math.PI; // Random angle in radians
        newParticles.push({
            id: Date.now() + i + Math.random(),
            x: 0, // Relative to center in animation
            y: 0,
            rotation: Math.random() * 360,
            scale: 0.5 + Math.random(),
            content: FLYING_ITEMS[Math.floor(Math.random() * FLYING_ITEMS.length)],
            angle: angle,
            velocity: 300 + Math.random() * 300 // Speed of explosion
        });
    }

    setParticles(prev => [...prev, ...newParticles]);

    // Cleanup particles after animation
    setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  };

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in overflow-hidden">
      
      {/* Header Info */}
      <div className="absolute top-4 w-full px-6 flex justify-between items-start text-white z-40">
        <div className="flex flex-col">
            <h3 className="text-xl font-bold font-serif text-brand-sand">Generating Look...</h3>
            <p className="text-xs text-gray-400 max-w-xs">{loadingMessage}</p>
        </div>
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
                <CoinIcon className="w-8 h-8 text-yellow-400" />
                <span className="text-3xl font-bold font-mono tracking-widest">{coinBalance.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Tap to earn!</p>
        </div>
      </div>

      {/* Timer */}
      <div className="absolute top-20 flex flex-col items-center z-40">
         <div className={`text-4xl font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            00:{timeLeft.toString().padStart(2, '0')}
         </div>
      </div>

      {/* Main Game Area */}
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        
        <AnimatePresence>
            {!isGameFinished ? (
                <div className="relative flex items-center justify-center">
                    {/* Particles Container - Centered */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                         {particles.map((p) => (
                            <motion.div
                                key={p.id}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                                animate={{ 
                                    x: Math.cos(p.angle) * p.velocity,
                                    y: Math.sin(p.angle) * p.velocity,
                                    opacity: 0,
                                    scale: p.scale * 1.5,
                                    rotate: p.rotation + 720
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="absolute text-5xl filter drop-shadow-lg saturate-150"
                            >
                                {p.content}
                            </motion.div>
                        ))}
                    </div>

                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleTap}
                        className="relative z-20 outline-none touch-manipulation group"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        {/* Custom Intricate Shiny Gold Coin */}
                        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full relative flex items-center justify-center
                            bg-gradient-to-br from-[#FFE082] via-[#FBC02D] to-[#F57F17]
                            shadow-[0_0_60px_rgba(253,216,53,0.6),inset_0_0_30px_rgba(255,255,255,0.6),0_10px_20px_rgba(0,0,0,0.5)]
                            border-[8px] border-[#F9A825]
                        ">
                            {/* Inner Bevel */}
                            <div className="absolute inset-2 rounded-full border-[2px] border-[#FFF59D]/50"></div>
                            
                            {/* Detailed Inner Ring */}
                            <div className="absolute inset-6 rounded-full border-[6px] border-dashed border-[#F57F17]/30"></div>

                            {/* Inner Face Gradient */}
                            <div className="absolute inset-8 rounded-full bg-gradient-to-tl from-[#FBC02D] to-[#FFF176] shadow-inner flex items-center justify-center">
                                {/* The 'C' Symbol */}
                                <span className="text-[10rem] md:text-[12rem] font-serif font-bold text-[#FFF9C4] drop-shadow-[0_4px_8px_rgba(166,100,0,0.6)] select-none">C</span>
                            </div>

                            {/* Shine / Glint Animation */}
                            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                                <div className="absolute -top-full -left-full w-[200%] h-[200%] bg-gradient-to-br from-transparent via-white/40 to-transparent rotate-45 animate-shimmer" />
                            </div>

                            {/* Hover Glow */}
                            <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        <p className="absolute -bottom-16 left-0 right-0 text-center text-white/70 text-sm font-bold tracking-widest animate-bounce">TAP RAPIDLY!</p>
                    </motion.button>
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center z-30 p-8 bg-white/10 rounded-3xl backdrop-blur-lg border border-white/20"
                >
                    <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-4">
                        Congratulations!
                    </h2>
                    <p className="text-white text-xl mb-6">You earned <span className="text-yellow-400 font-bold">{gameScore}</span> coins!</p>
                    <p className="text-gray-300 text-sm animate-pulse">Your image is almost ready...</p>
                    
                    {/* Firework effects in background */}
                    <div className="absolute inset-0 -z-10 overflow-hidden">
                        {[...Array(8)].map((_, i) => (
                             <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                animate={{ 
                                    opacity: [0, 1, 0], 
                                    scale: [0, 2, 4],
                                    x: Math.random() * 400 - 200,
                                    y: Math.random() * 400 - 200
                                }}
                                transition={{ 
                                    duration: 2, 
                                    repeat: Infinity, 
                                    delay: i * 0.2,
                                    ease: "easeOut"
                                }}
                                className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 blur-xl opacity-30"
                             />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="absolute bottom-10 text-center w-full z-20">
            <p className="text-gray-500 text-xs uppercase tracking-widest">fitCREATE</p>
        </div>
      </div>
    </div>
  );
};

export default TapToEarnGame;
