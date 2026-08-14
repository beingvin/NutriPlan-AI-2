import React, { useState, useRef } from 'react';
import { PantryItem } from '../types';
import { Plus, Trash2, Camera, Upload, Sparkles, RefreshCw, CheckCircle2, Shield, Box, Tag, Edit2, Check, X } from 'lucide-react';
import { PantryAnalyticsChart } from './PantryAnalyticsChart';

interface PantryManagerViewProps {
  inventory: PantryItem[];
  setInventory: React.Dispatch<React.SetStateAction<PantryItem[]>>;
  onLoadPreset: (preset: 'full' | 'low' | 'high_protein') => void;
}

export const PantryManagerView: React.FC<PantryManagerViewProps> = ({
  inventory,
  setInventory,
  onLoadPreset,
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<PantryItem['category']>('pulses_legumes');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('g');
  const [isShelfStable, setIsShelfStable] = useState(true);

  // Editing state for stock items
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemData, setEditItemData] = useState<PantryItem | null>(null);

  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoriesMap: Record<PantryItem['category'], { label: string; icon: string }> = {
    pulses_legumes: { label: 'Pulses, Dals & Soya', icon: '🫘' },
    grains_flours: { label: 'Grains, Atta & Cereals', icon: '🌾' },
    seeds_nuts: { label: 'Seeds & Nuts', icon: '🥜' },
    fresh_produce: { label: 'Onions, Tomatoes & Fruit', icon: '🧅' },
    dairy_alternatives: { label: 'Dairy & Alternatives', icon: '🥛' },
    spices_others: { label: 'Spices & Pantry Staples', icon: '🧂' },
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const item: PantryItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: Number(newItemQty),
      unit: newItemUnit,
      isShelfStable,
    };

    setInventory((prev) => [...prev, item]);
    setNewItemName('');
    setNewItemQty(1);
  };

  const handleDeleteItem = (id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
      setEditItemData(null);
    }
  };

  const handleStartEdit = (item: PantryItem) => {
    setEditingItemId(item.id);
    setEditItemData({ ...item });
  };

  const handleSaveEdit = () => {
    if (!editItemData || !editItemData.name.trim()) return;
    setInventory((prev) =>
      prev.map((i) => (i.id === editItemData.id ? editItemData : i))
    );
    setEditingItemId(null);
    setEditItemData(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditItemData(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanMessage('Scanning photo/receipt with Gemini Vision OCR...');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const mimeType = file.type || 'image/jpeg';

        const res = await fetch('/api/scan-pantry-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data, mimeType }),
        });

        if (!res.ok) throw new Error('Pantry scan failed');
        const data = await res.json();

        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          const scannedItems: PantryItem[] = data.items.map((item: any, index: number) => ({
            id: (Date.now() + index).toString(),
            name: item.name,
            category: item.category || 'pulses_legumes',
            quantity: item.quantity || 100,
            unit: item.unit || 'g',
            isShelfStable: item.isShelfStable ?? true,
          }));

          setInventory((prev) => [...prev, ...scannedItems]);
          setScanMessage(`Successfully extracted ${scannedItems.length} pantry items!`);
        } else {
          setScanMessage('No grocery items detected in image. Please try a clearer picture.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setScanMessage(`Scan error: ${err.message || 'Failed to analyze photo'}`);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Vision Scanner Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <Box className="w-4 h-4" />
            <span>Pantry Inventory Manager</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Available Non-Refrigerated Stock</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            The AI Dietitian dynamically crafts 7-day meal plans using these items. Keep your stock updated or scan a pantry photo/grocery receipt.
          </p>
        </div>

        {/* OCR Vision Scanner Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-3 rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning Image...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Scan Pantry Photo / Receipt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center justify-between">
          <span>{scanMessage}</span>
          <button onClick={() => setScanMessage(null)} className="text-emerald-600 hover:underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Analytics & Freshness Expiry Chart */}
      <PantryAnalyticsChart inventory={inventory} />

      {/* Manual Item Adder Form */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>Add Custom Pantry Item</span>
        </h3>

        <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Item name (e.g. Moong Dal, Chia Seeds)"
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />

          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value as PantryItem['category'])}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="pulses_legumes">🫘 Pulses, Dals & Soya</option>
            <option value="grains_flours">🌾 Grains & Atta</option>
            <option value="seeds_nuts">🥜 Seeds & Nuts</option>
            <option value="fresh_produce">🧅 Fresh Produce</option>
            <option value="dairy_alternatives">🥛 Dairy / Alternatives</option>
            <option value="spices_others">🧂 Spices & Staples</option>
          </select>

          <div className="flex space-x-2">
            <input
              type="number"
              value={newItemQty}
              onChange={(e) => setNewItemQty(Number(e.target.value))}
              min="0.1"
              step="any"
              className="w-1/2 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <select
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              className="w-1/2 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="pcs">pcs</option>
              <option value="L">L</option>
              <option value="ml">ml</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={isShelfStable}
              onChange={(e) => setIsShelfStable(e.target.checked)}
              className="rounded-md text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span>Non-Refrigerated Shelf-Stable</span>
          </label>

          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-2xs"
          >
            Add to Stock
          </button>
        </form>
      </div>

      {/* Categorized Pantry Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(Object.keys(categoriesMap) as Array<PantryItem['category']>).map((cat) => {
          const catInfo = categoriesMap[cat];
          const itemsInCat = inventory.filter((item) => item.category === cat);

          return (
            <div key={cat} className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{catInfo.icon}</span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">{catInfo.label}</h3>
                </div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {itemsInCat.length} items
                </span>
              </div>

              {itemsInCat.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-2">No items in this category.</p>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {itemsInCat.map((item) => {
                    const isEditing = editingItemId === item.id;

                    if (isEditing) {
                      return (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-300 space-y-2 text-xs shadow-2xs"
                        >
                          <div>
                            <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-0.5">
                              Item Name
                            </label>
                            <input
                              type="text"
                              value={editItemData?.name || ''}
                              onChange={(e) =>
                                setEditItemData((prev) => (prev ? { ...prev, name: e.target.value } : null))
                              }
                              className="w-full px-2 py-1 text-xs border border-emerald-300 rounded-lg bg-white font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              placeholder="Item name"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                Qty & Unit
                              </label>
                              <div className="flex space-x-1">
                                <input
                                  type="number"
                                  value={editItemData?.quantity ?? 1}
                                  onChange={(e) =>
                                    setEditItemData((prev) =>
                                      prev ? { ...prev, quantity: Number(e.target.value) } : null
                                    )
                                  }
                                  min="0.1"
                                  step="any"
                                  className="w-1/2 px-2 py-1 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                                />
                                <select
                                  value={editItemData?.unit || 'g'}
                                  onChange={(e) =>
                                    setEditItemData((prev) => (prev ? { ...prev, unit: e.target.value } : null))
                                  }
                                  className="w-1/2 px-2 py-1 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                  <option value="g">g</option>
                                  <option value="kg">kg</option>
                                  <option value="pcs">pcs</option>
                                  <option value="L">L</option>
                                  <option value="ml">ml</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                Category
                              </label>
                              <select
                                value={editItemData?.category || 'pulses_legumes'}
                                onChange={(e) =>
                                  setEditItemData((prev) =>
                                    prev ? { ...prev, category: e.target.value as PantryItem['category'] } : null
                                  )
                                }
                                className="w-full px-2 py-1 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              >
                                <option value="pulses_legumes">🫘 Pulses & Soya</option>
                                <option value="grains_flours">🌾 Grains & Atta</option>
                                <option value="seeds_nuts">🥜 Seeds & Nuts</option>
                                <option value="fresh_produce">🧅 Produce</option>
                                <option value="dairy_alternatives">🥛 Dairy</option>
                                <option value="spices_others">🧂 Spices</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center space-x-1.5 text-[11px] text-slate-700 font-medium cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editItemData?.isShelfStable ?? true}
                                onChange={(e) =>
                                  setEditItemData((prev) =>
                                    prev ? { ...prev, isShelfStable: e.target.checked } : null
                                  )
                                }
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                              />
                              <span>Shelf-Stable</span>
                            </label>

                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={handleSaveEdit}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md transition-colors flex items-center space-x-1 text-[11px] font-semibold shadow-2xs"
                                title="Save changes"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded-md transition-colors flex items-center space-x-1 text-[11px] font-semibold"
                                title="Cancel editing"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-emerald-50/50 transition-colors border border-slate-100 group text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800">{item.name}</span>
                          <div className="text-[10px] text-slate-500">
                            Quantity: <strong className="text-slate-700">{item.quantity} {item.unit}</strong>
                            {item.isShelfStable && <span className="ml-2 text-emerald-700 font-medium"> (Shelf-stable)</span>}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 opacity-70 group-hover:opacity-100 transition-all shrink-0">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="text-slate-400 hover:text-emerald-600 p-1 rounded-md transition-colors"
                            title="Edit item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
