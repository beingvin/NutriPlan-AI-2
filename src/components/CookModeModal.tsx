import React, { useState, useEffect, useRef } from 'react';
import { Meal } from '../types';
import {
  X, Clock, Flame, Play, Pause, RotateCcw, Check, ChefHat,
  Sparkles, ChevronLeft, ChevronRight, Volume2, VolumeX,
  Plus, Minus, Timer, ShieldCheck, HeartPulse, ListChecks
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CookModeModalProps {
  isOpen?: boolean;
  meal?: Meal | null;
  mealSlotName?: string;
  dayName?: string;
  allMealsOfDay?: { slotKey: string; label: string; meal: Meal }[];
  currentSlotIndex?: number;
  onSelectSlotIndex?: (index: number) => void;
  onClose: () => void;
  onMarkCooked?: (mealId: string) => void;
}

export const CookModeModal: React.FC<CookModeModalProps> = ({
  isOpen = true,
  meal,
  mealSlotName,
  dayName,
  allMealsOfDay = [],
  currentSlotIndex = 0,
  onSelectSlotIndex,
  onClose,
  onMarkCooked,
}) => {
  if (!isOpen || !meal) return null;

  const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerInitial, setTimerInitial] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const timerRef = useRef<any>(null);

  // Parse preparation steps into distinct actionable instructions
  const steps = React.useMemo(() => {
    if (!meal?.preparationNotes) return ['Prepare fresh ingredients according to portion.'];
    const parts = meal.preparationNotes
      .split(/\. |\n|; /)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);
    return parts.length > 0 ? parts : [meal.preparationNotes];
  }, [meal?.preparationNotes]);

  // Audio Beep generator using Web Audio API
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            playAlertSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, soundEnabled]);

  const startPresetTimer = (seconds: number) => {
    setTimerInitial(seconds);
    setTimerSeconds(seconds);
    setTimerRunning(true);
  };

  const toggleTimer = () => {
    if (timerSeconds === 0 && timerInitial > 0) {
      setTimerSeconds(timerInitial);
    }
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(timerInitial);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto flex flex-col ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top App Bar in Kitchen Mode */}
      <div className={`sticky top-0 z-20 px-4 sm:px-6 py-3.5 border-b backdrop-blur-md flex items-center justify-between ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-lg">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Kitchen Cook Mode
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
              }`}>
                {meal.type || 'Meal'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black truncate max-w-xs sm:max-w-md">
              {meal.name}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Servings Multiplier */}
          <div className={`hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-xl border ${
            darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Servings:</span>
            {[1, 2, 4].map((mult) => (
              <button
                key={mult}
                onClick={() => setServingsMultiplier(mult)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  servingsMultiplier === mult
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mult}x
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Toggle Kitchen Contrast"
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content Layout: Two Columns on Desktop, Single Column on Mobile */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recipe Steps & Active Timers (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Nutrition Banner at a glance */}
          <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Macros</span>
                <span className="text-sm font-bold text-emerald-400">
                  {meal.proteinGrams * servingsMultiplier}g Protein • {meal.caloriesKcal * servingsMultiplier} kcal
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Serving Portion</span>
              <span className="text-xs font-semibold text-slate-300">
                {meal.portion} {servingsMultiplier > 1 ? `(Scaled for ${servingsMultiplier} people)` : ''}
              </span>
            </div>
          </div>

          {/* Step-by-Step Cooking Steps */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-800/80">
              <div className="flex items-center space-x-2">
                <ListChecks className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold">Preparation & Cooking Steps</h2>
              </div>
              <span className="text-xs text-slate-400">
                {Object.values(completedSteps).filter(Boolean).length} / {steps.length} Completed
              </span>
            </div>

            <div className="space-y-3">
              {steps.map((stepText, idx) => {
                const isDone = completedSteps[idx];
                return (
                  <motion.div
                    key={idx}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => toggleStep(idx)}
                    className={`p-4 rounded-xl border flex items-start space-x-3.5 transition-all cursor-pointer ${
                      isDone
                        ? darkMode
                          ? 'bg-emerald-950/30 border-emerald-700/50 text-slate-400'
                          : 'bg-emerald-50 border-emerald-200 text-slate-500'
                        : darkMode
                          ? 'bg-slate-800/70 border-slate-700 hover:border-emerald-500/50'
                          : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-colors ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950'
                        : darkMode
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="flex-1 text-sm sm:text-base leading-relaxed font-medium">
                      <span className={isDone ? 'line-through opacity-70' : ''}>{stepText}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Navigation between today's meals */}
          {allMealsOfDay.length > 1 && onSelectSlotIndex && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <button
                onClick={() => {
                  const nextIdx = (currentSlotIndex - 1 + allMealsOfDay.length) % allMealsOfDay.length;
                  onSelectSlotIndex(nextIdx);
                }}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Meal</span>
              </button>

              <div className="text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Current Meal</span>
                <span className="text-xs font-black text-emerald-400">
                  {allMealsOfDay[currentSlotIndex]?.label || meal.type}
                </span>
              </div>

              <button
                onClick={() => {
                  const nextIdx = (currentSlotIndex + 1) % allMealsOfDay.length;
                  onSelectSlotIndex(nextIdx);
                }}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                <span>Next Meal</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Kitchen Timer & Ingredients Checklist (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Integrated Kitchen Timer */}
          <div className={`p-5 rounded-2xl border shadow-lg space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-800/80">
              <div className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Kitchen Countdown Timer</h3>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-slate-400 hover:text-slate-200 p-1"
                title="Toggle Beep"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Timer Display */}
            <div className="text-center py-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
                timerSeconds > 0 && timerSeconds <= 10
                  ? 'text-rose-400 animate-pulse'
                  : timerRunning
                    ? 'text-emerald-400'
                    : 'text-slate-300'
              }`}>
                {formatTimer(timerSeconds)}
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 block">
                {timerRunning ? 'Cooking in Progress...' : 'Timer Paused / Ready'}
              </span>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={toggleTimer}
                disabled={timerSeconds === 0 && timerInitial === 0}
                className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center space-x-1.5 cursor-pointer shadow-md transition-all active:scale-95 ${
                  timerRunning
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                {timerRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>{timerSeconds === 0 ? 'Start' : 'Resume'}</span>
                  </>
                )}
              </button>

              <button
                onClick={resetTimer}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Preset Cooking Timers */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Indian Cooking Presets</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: '🌶️ Tadka (2m)', sec: 120 },
                  { label: '🥚 Soft Boil (5m)', sec: 300 },
                  { label: '💨 Cooker (8m)', sec: 480 },
                  { label: '🥘 Simmer (15m)', sec: 900 },
                ].map((preset) => (
                  <button
                    key={preset.sec}
                    onClick={() => startPresetTimer(preset.sec)}
                    className="px-2.5 py-2 rounded-xl text-[11px] font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-left transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredients Checklist */}
          <div className={`p-5 rounded-2xl border space-y-3.5 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between border-b pb-2 border-slate-800/80">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <ChefHat className="w-4 h-4 text-emerald-400" />
                <span>Required Ingredients</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {Object.values(checkedIngredients).filter(Boolean).length} / {meal.ingredients?.length || 0}
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(meal.ingredients || []).map((ing, idx) => {
                const isChecked = checkedIngredients[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleIngredient(idx)}
                    className={`p-2.5 rounded-xl border flex items-center space-x-2.5 transition-all cursor-pointer text-xs ${
                      isChecked
                        ? 'bg-emerald-950/40 border-emerald-700/50 text-slate-400'
                        : 'bg-slate-800/40 border-slate-700/80 hover:border-slate-600 text-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isChecked ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={`font-medium ${isChecked ? 'line-through' : ''}`}>
                      {ing} {servingsMultiplier > 1 ? `(x${servingsMultiplier})` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
