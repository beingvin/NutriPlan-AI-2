import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  X, HeartPulse, Sparkles, ShieldCheck, Apple, Droplet,
  CheckCircle2, Info, Flame, AlertCircle, Copy, Share2, Send
} from 'lucide-react';
import { motion } from 'motion/react';

interface MicronutrientGuideModalProps {
  isOpen?: boolean;
  userProfile?: UserProfile;
  onClose: () => void;
}

export const MicronutrientGuideModal: React.FC<MicronutrientGuideModalProps> = ({
  isOpen = true,
  userProfile,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'micronutrients' | 'anti_bloating' | 'tea_recipes'>('micronutrients');
  const [copyToast, setCopyToast] = useState(false);

  const handleCopy = () => {
    const text = `🧬 *ICMR 2024 Vegetarian Micronutrient & Gut Health Protocol*\n\n` +
      `1. *Vitamin B12*: Mandatory fortification/supplementation (1500 mcg methylcobalamin weekly or 500 mcg daily).\n` +
      `2. *Iron + Vitamin C*: Always squeeze fresh lemon on dals right before eating. Avoid tea/coffee 1 hour before/after meals.\n` +
      `3. *Calcium*: 1 glass milk/curd (300mg) + 2 tbsp roasted sesame seeds (til, 180mg) meets daily ICMR target.\n` +
      `4. *Anti-Bloating*: Soak Rajma/Chana with a pinch of rock salt for 8-10 hrs. Add Hing & Ajwain to reduce gas.\n` +
      `5. *Digestive CCF Tea*: Boil 1/2 tsp Cumin + 1/2 tsp Coriander seeds + 1/2 tsp Fennel seeds in 300ml water.\n\n` +
      `_DietPlan AI Protocol_`;
    navigator.clipboard.writeText(text);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-cyan-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-emerald-800 flex items-center justify-center font-black shadow-md shrink-0">
              <HeartPulse className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  ICMR & NIN 2024 Clinical Guide
                </span>
                <span className="bg-emerald-400/20 text-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-300/30">
                  Evidence-Based
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Micronutrients & Gut Health Guide
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold overflow-x-auto shrink-0">
          {[
            { id: 'micronutrients', label: '🧬 Key Vegetarian Micronutrients' },
            { id: 'anti_bloating', label: '🌿 Anti-Bloating & Soaking' },
            { id: 'tea_recipes', label: '☕ CCF Digestive Infusion' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs sm:text-sm">
          
          {/* TAB 1: MICRONUTRIENTS */}
          {activeTab === 'micronutrients' && (
            <div className="space-y-4">
              
              {/* B12 & D3 Card */}
              <div className="bg-rose-50/60 border border-rose-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center space-x-2 text-rose-900 font-bold text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <h4>Vitamin B12 & Vitamin D3 (Critical for Vegetarians)</h4>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Plant foods do not naturally synthesize Vitamin B12. ICMR recommends all vegetarians maintain routine testing.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-2xs space-y-1">
                    <span className="font-bold text-rose-900 block">🥛 Dietary Sources</span>
                    <p className="text-slate-600">Fresh curd (dahi), fortified plant milks, paneer, and nutritional yeast.</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-2xs space-y-1">
                    <span className="font-bold text-rose-900 block">💊 ICMR Safe Target</span>
                    <p className="text-slate-600">2.2 mcg/day RDA. Consider 500-1500 mcg cyanocobalamin weekly if plant-based.</p>
                  </div>
                </div>
              </div>

              {/* Bioavailable Iron + Vitamin C Pairing */}
              <div className="bg-amber-50/60 border border-amber-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <h4>Maximizing Non-Heme Iron Absorption</h4>
                </div>
                <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                  <p>
                    Plant-based non-heme iron (from spinach, chana, rajma, bajra) is sensitive to inhibitors. Applying simple food science boosts absorption up to <strong>300%</strong>:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-600">
                    <li><strong className="text-slate-800">The Citrus Rule:</strong> Squeeze fresh lemon juice (Vitamin C) directly onto hot dal or sabzi right before serving.</li>
                    <li><strong className="text-slate-800">Tannin Timing:</strong> Avoid drinking chai, green tea, or coffee within 60 minutes of lunch/dinner, as tannins block iron uptake.</li>
                    <li><strong className="text-slate-800">Cast Iron Cookware:</strong> Cooking acidic curries in seasoned iron kadhais naturally enhances dietary iron content.</li>
                  </ul>
                </div>
              </div>

              {/* Calcium & Zinc */}
              <div className="bg-sky-50/60 border border-sky-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center space-x-2 text-sky-900 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                  <h4>Calcium & Zinc Super-Pillars</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-sky-100 shadow-2xs space-y-1">
                    <span className="font-bold text-sky-900 block">🦴 High-Calcium Staples</span>
                    <p className="text-slate-600">Ragi (Finger Millet) has 344mg Ca/100g, 2 tbsp white/black sesame seeds (til), and low-fat paneer.</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-sky-100 shadow-2xs space-y-1">
                    <span className="font-bold text-sky-900 block">⚡ Zinc & Immunity</span>
                    <p className="text-slate-600">Pumpkin seeds (magaz), sunflower seeds, soaked almonds, and fermented curd.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ANTI-BLOATING & SOAKING */}
          {activeTab === 'anti_bloating' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4">
                <h4 className="font-bold text-emerald-950 text-sm">
                  Why Legumes Cause Gas & How to Prevent It
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Pulses contain oligosaccharides (raffinose & stachyose) that humans cannot digest without proper soaking and carminative spices.
                </p>
              </div>

              {/* Soaking Chart */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Pulse / Ingredient</th>
                      <th className="p-3">Optimal Soak Duration</th>
                      <th className="p-3">Carminative Spice Pairing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="p-3 font-bold">Rajma & Chana</td>
                      <td className="p-3">8 – 10 Hours (Warm Water)</td>
                      <td className="p-3">Hing (Asafoetida) + Ginger + Bay Leaf</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">Toor & Moong Dal</td>
                      <td className="p-3">30 – 45 Minutes</td>
                      <td className="p-3">Jeera (Cumin) + Turmeric</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">Besan (Gram Flour)</td>
                      <td className="p-3">15 Min resting batter</td>
                      <td className="p-3">Ajwain (Carom Seeds) + Black Pepper</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">Urad Dal / Idli Mix</td>
                      <td className="p-3">6 Hours Soak + Ferment</td>
                      <td className="p-3">Fenugreek (Methi seeds)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CCF TEA RECIPE */}
          {activeTab === 'tea_recipes' && (
            <div className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                  <Apple className="w-5 h-5 text-amber-700" />
                  <h4>Traditional CCF Digestive Tea (Cumin, Coriander, Fennel)</h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Drinking warm CCF tea 20 minutes after a high-protein lunch gently stimulates bile acids, prevents sluggish digestion, and eliminates post-meal heaviness.
                </p>

                <div className="bg-white p-4 rounded-xl border border-amber-200/80 space-y-2 text-xs">
                  <h5 className="font-bold text-slate-900">Ingredients (1 Serving):</h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                    <li>1/2 teaspoon Cumin seeds (Jeera)</li>
                    <li>1/2 teaspoon Coriander seeds (Dhaniya)</li>
                    <li>1/2 teaspoon Fennel seeds (Saunf)</li>
                    <li>350 ml filtered water</li>
                    <li>Optional: Slice of fresh ginger or squeeze of lemon</li>
                  </ul>

                  <h5 className="font-bold text-slate-900 pt-2">Method:</h5>
                  <p className="text-slate-600">
                    Bring water and whole seeds to a rolling boil for 5 minutes. Cover, let steep for 3 minutes, strain into a mug, and sip warm.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={handleCopy}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copyToast ? 'Copied Summary!' : 'Copy Clinical Protocol'}</span>
          </button>

          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Done
          </button>
        </div>

      </motion.div>
    </div>
  );
};
