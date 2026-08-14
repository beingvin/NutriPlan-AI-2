import React, { useState } from 'react';
import { WeeklyMealPlan, ShoppingListItem } from '../types';
import { ShoppingBag, IndianRupee, Printer, CheckCircle2, AlertCircle, Sparkles, Tag, ShieldCheck, Copy, Check, Share2, FileText, X, MessageSquare } from 'lucide-react';
import { BENCHMARK_PRICES_INR } from '../data/pantryPresets';
import { motion, AnimatePresence } from 'motion/react';

interface ShoppingTrackerViewProps {
  plan: WeeklyMealPlan | null;
  dailyBudgetInr: number;
}

export const ShoppingTrackerView: React.FC<ShoppingTrackerViewProps> = ({
  plan,
  dailyBudgetInr,
}) => {
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [modalCopied, setModalCopied] = useState(false);
  const [formatStyle, setFormatStyle] = useState<'whatsapp' | 'simple' | 'categorized'>('whatsapp');

  const targetWeeklyBudgetMin = dailyBudgetInr * 7; // e.g. 150 * 7 = 1050
  const targetWeeklyBudgetMax = 200 * 7; // 1400

  const shoppingList: ShoppingListItem[] = plan?.shoppingList || [
    { item: 'Toor Dal (Arhar)', quantityNeeded: '500g', estimatedCostInr: 61, category: 'Pulses', reason: 'To hit 80g daily protein' },
    { item: 'Soya Chunks', quantityNeeded: '300g', estimatedCostInr: 33, category: 'Pulses', reason: 'High protein staple for dinner' },
    { item: 'Onions & Tomatoes', quantityNeeded: '1kg each', estimatedCostInr: 74, category: 'Produce', reason: 'Base gravy & salads' },
    { item: 'Unsweetened Muesli', quantityNeeded: '400g', estimatedCostInr: 140, category: 'Cereals', reason: 'Zero-added-sugar breakfast' },
    { item: 'Bananas & Guava', quantityNeeded: '1 dozen / 500g', estimatedCostInr: 90, category: 'Fruits', reason: '≥5 fruit/veg portions' },
  ];

  const totalWeeklyCost = plan?.totalWeeklyCostInr || shoppingList.reduce((acc, curr) => acc + curr.estimatedCostInr, 0);
  const budgetUsagePercent = Math.min(Math.round((totalWeeklyCost / targetWeeklyBudgetMax) * 100), 100);

  const generateFormattedText = (style: 'whatsapp' | 'simple' | 'categorized'): string => {
    if (style === 'simple') {
      let text = `GROCERY SHOPPING LIST (Est. ₹${totalWeeklyCost})\n`;
      text += `------------------------------------\n`;
      shoppingList.forEach((item, idx) => {
        text += `[ ] ${idx + 1}. ${item.item} - ${item.quantityNeeded} (~₹${item.estimatedCostInr})\n`;
      });
      text += `------------------------------------\nTotal Items: ${shoppingList.length}`;
      return text;
    }

    if (style === 'categorized') {
      let text = `🛒 *SHOPPING LIST BY CATEGORY*\n`;
      text += `💰 Est. Total: ₹${totalWeeklyCost}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      const categories: { [cat: string]: ShoppingListItem[] } = {};
      shoppingList.forEach(item => {
        const cat = item.category || 'Other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(item);
      });

      Object.keys(categories).forEach(cat => {
        text += `📌 *${cat.toUpperCase()}*\n`;
        categories[cat].forEach((item) => {
          text += `  • *${item.item}*: ${item.quantityNeeded} (~₹${item.estimatedCostInr})\n`;
        });
        text += `\n`;
      });

      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `✨ *NutriPlan AI* - ICMR 2024 Diet Plan`;
      return text;
    }

    // Default: WhatsApp Rich Format
    let text = `🛒 *NutriPlan AI - Weekly Grocery List*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *Est. Total Cost:* ₹${totalWeeklyCost} (Budget: ₹${targetWeeklyBudgetMin} - ₹${targetWeeklyBudgetMax})\n`;
    text += `📦 *Total Items Needed:* ${shoppingList.length}\n\n`;
    text += `*SHOPPING ITEMS:*\n`;

    shoppingList.forEach((item, idx) => {
      text += `${idx + 1}. ▫️ *${item.item}* — ${item.quantityNeeded} (~₹${item.estimatedCostInr})\n`;
      if (item.category) text += `   • Category: ${item.category}\n`;
      if (item.reason) text += `   • Purpose: ${item.reason}\n`;
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✨ *NutriPlan AI* | ICMR 2024 & WHO Approved Zero-Sugar Plan`;
    return text;
  };

  const formattedText = generateFormattedText(formatStyle);

  const handleCopyText = (textToCopy: string, isModal = false) => {
    navigator.clipboard.writeText(textToCopy);
    if (isModal) {
      setModalCopied(true);
      setTimeout(() => setModalCopied(false), 2500);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(formattedText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Weekly Grocery Shopping List - NutriPlan AI',
          text: formattedText,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopyText(formattedText, true);
    }
  };

  const handlePrintList = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Budget Monitor Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span>Grocery & Budget Monitor</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Weekly Shopping List (Stock Gap Analysis)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Additional grocery items required to fulfill your 7-day meal plan while maintaining zero added sugar & ICMR guidelines.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-auto flex-wrap gap-y-2">
            <button
              onClick={() => setExportModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Export to Text</span>
            </button>

            <button
              onClick={() => handleCopyText(generateFormattedText('whatsapp'), false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2 transition-colors border border-slate-200 cursor-pointer"
              title="Copy formatted text to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? 'Copied!' : 'Quick Copy'}</span>
            </button>

            <button
              onClick={handlePrintList}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Budget Meter */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Estimated Weekly Grocery Cost:</span>
            <span className="text-sm font-extrabold text-emerald-800">
              ₹{totalWeeklyCost} <span className="text-[11px] font-normal text-slate-500">(Target: ₹{targetWeeklyBudgetMin} - ₹{targetWeeklyBudgetMax})</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalWeeklyCost <= targetWeeklyBudgetMax ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${budgetUsagePercent}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>₹0</span>
            <span className="font-semibold text-emerald-700">₹{dailyBudgetInr}/day target</span>
            <span>₹{targetWeeklyBudgetMax} Max</span>
          </div>
        </div>
      </div>

      {/* Grocery Items List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Itemized Purchases Needed ({shoppingList.length} Items)</span>
          </h3>

          <button
            onClick={() => setExportModalOpen(true)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Copy for WhatsApp / SMS</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {shoppingList.map((item, idx) => (
            <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.item}</h4>
                  <p className="text-[11px] text-slate-500">
                    Quantity: <strong className="text-slate-700">{item.quantityNeeded}</strong> • Category: <span className="capitalize text-slate-700">{item.category}</span>
                  </p>
                  <p className="text-[11px] text-slate-600 italic mt-0.5">"{item.reason}"</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  ~ ₹{item.estimatedCostInr}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Govt Price Benchmark Reference Table */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
        <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Indian Govt Department of Consumer Affairs Retail Price Benchmarks (2026)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {Object.entries(BENCHMARK_PRICES_INR).map(([itemName, data]) => (
            <div key={itemName} className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
              <span className="block text-[11px] text-slate-500 font-medium">{itemName}</span>
              <span className="font-bold text-slate-900">₹{data.pricePerKgOrL} / {data.defaultUnit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Export to Text Modal */}
      <AnimatePresence>
        {exportModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 my-8"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Export Shopping List</h3>
                    <p className="text-xs text-slate-500">Formatted for WhatsApp, Telegram, or Notes</p>
                  </div>
                </div>
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Format Style Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Choose Text Style:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setFormatStyle('whatsapp')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formatStyle === 'whatsapp'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    💬 WhatsApp / Rich
                  </button>
                  <button
                    onClick={() => setFormatStyle('categorized')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formatStyle === 'categorized'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    📂 Categorized
                  </button>
                  <button
                    onClick={() => setFormatStyle('simple')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formatStyle === 'simple'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    📝 Simple Checklist
                  </button>
                </div>
              </div>

              {/* Text Area Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Formatted Text Preview</span>
                  <span>{formattedText.length} characters</span>
                </div>
                <textarea
                  readOnly
                  value={formattedText}
                  rows={9}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 leading-relaxed resize-none selection:bg-emerald-200"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleCopyText(formattedText, true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    {modalCopied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                    <span>{modalCopied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}</span>
                  </button>

                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <MessageSquare className="w-4 h-4 text-green-200" />
                    <span>Send via WhatsApp</span>
                  </button>
                </div>

                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors border border-slate-200 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Share via App (Native Share Sheet)</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

