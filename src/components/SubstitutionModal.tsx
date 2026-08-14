import React, { useState } from 'react';
import { SubstitutionResult, PantryItem, UserProfile } from '../types';
import { X, RefreshCw, CheckCircle2, ShieldCheck, Sparkles, Scale } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealName: string;
  ingredientToSubstitute?: string;
  inventory: PantryItem[];
  userProfile: UserProfile;
}

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  isOpen,
  onClose,
  mealName,
  ingredientToSubstitute = '',
  inventory,
  userProfile,
}) => {
  const [missingItem, setMissingItem] = useState(ingredientToSubstitute);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubstitutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubstitute = async () => {
    if (!missingItem.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/substitute', {
        method: 'POST',
        body: JSON.stringify({
          missingItem,
          mealName,
          inventory,
          allergies: userProfile.allergies,
        }),
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error generating substitution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-emerald-700 font-semibold text-lg mb-1">
          <Sparkles className="w-5 h-5" />
          <span>Smart Ingredient Substitution</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Replace missing ingredients for <strong className="text-slate-700">{mealName}</strong> using available pantry stock.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ingredient You Are Out Of:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={missingItem}
                onChange={(e) => setMissingItem(e.target.value)}
                placeholder="e.g. Curd, Peanuts, Tomatoes, Soya Chunks"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleSubstitute}
                disabled={loading || !missingItem.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-4 py-2 rounded-lg flex items-center space-x-1.5 disabled:opacity-50 transition-colors"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Find Substitute</span>}
              </button>
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>}

          {result && (
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                <div className="text-xs text-slate-500">
                  Replace: <span className="line-through text-red-500 font-medium">{result.originalItem}</span>
                </div>
                <div className="flex items-center space-x-1 text-xs font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-full shadow-2xs border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Use: {result.substituteItem}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-700">
                <div className="flex items-start space-x-2">
                  <Scale className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Portion & Recipe Change:</span>{' '}
                    {result.portionAdjustment}. {result.recipeAdjustment}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Nutritional Impact:</span>{' '}
                    {result.nutritionalImpact}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Allergen & Zero-Sugar Check:</span>{' '}
                    {result.allergenSafetyCheck}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
