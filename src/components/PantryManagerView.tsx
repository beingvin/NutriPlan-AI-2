import React, { useState, useRef } from 'react';
import { PantryItem } from '../types';
import {
  Plus, Trash2, Camera, Upload, Sparkles, RefreshCw, CheckCircle2,
  Shield, Box, Tag, Edit2, Check, X, Table, LayoutGrid, Search,
  Filter, Layers, ArrowUpDown, Clock
} from 'lucide-react';
import { PantryAnalyticsChart } from './PantryAnalyticsChart';
import { apiFetch } from '../lib/api';

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

  // View Mode: 'table' vs 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'qty_desc' | 'shelf_stable'>('category');

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

        const data = await apiFetch('/api/scan-pantry-image', {
          method: 'POST',
          body: JSON.stringify({ imageBase64: base64Data, mimeType }),
        });

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

  // Filtered and sorted inventory
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (categoriesMap[item.category]?.label || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'category') return a.category.localeCompare(b.category);
    if (sortBy === 'qty_desc') return b.quantity - a.quantity;
    if (sortBy === 'shelf_stable') return (b.isShelfStable ? 1 : 0) - (a.isShelfStable ? 1 : 0);
    return 0;
  });

  const shelfStableCount = inventory.filter(i => i.isShelfStable).length;
  const perishableCount = inventory.length - shelfStableCount;

  return (
    <div className="space-y-6">
      {/* Header & Vision Scanner Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <Box className="w-4 h-4" />
            <span>Pantry Inventory Manager</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Available Non-Refrigerated Stock</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            The AI Dietitian dynamically crafts 7-day meal plans using these items. Keep your stock updated or scan a pantry photo/grocery receipt.
          </p>
        </div>

        {/* OCR Vision Scanner & Preset Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 sm:px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning Image...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Scan Photo / Receipt</span>
              </>
            )}
          </button>

          {/* Quick Presets Dropdown/Buttons */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onLoadPreset('full')}
              className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
              title="Load standard Indian pantry essentials"
            >
              Full Pantry
            </button>
            <button
              onClick={() => onLoadPreset('high_protein')}
              className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              title="Load high-protein vegetarian pantry"
            >
              High Protein
            </button>
          </div>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center justify-between">
          <span>{scanMessage}</span>
          <button onClick={() => setScanMessage(null)} className="text-emerald-600 hover:underline text-[11px] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Analytics & Freshness Expiry Chart */}
      <PantryAnalyticsChart inventory={inventory} />

      {/* Manual Item Adder Form */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
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
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            required
          />

          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value as PantryItem['category'])}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
              className="w-1/2 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <select
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              className="w-1/2 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
              className="rounded-md text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span>Shelf-Stable (No Fridge)</span>
          </label>

          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            Add to Stock
          </button>
        </form>
      </div>

      {/* View Mode, Search & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Top/Left: Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search pantry items or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bottom/Right Controls: Category, Sort, View Toggle */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 py-2 px-2.5 rounded-xl focus:outline-hidden cursor-pointer"
            >
              <option value="all">All ({inventory.length})</option>
              {(Object.keys(categoriesMap) as Array<PantryItem['category']>).map((cat) => (
                <option key={cat} value={cat}>
                  {categoriesMap[cat].icon} {categoriesMap[cat].label} ({inventory.filter(i => i.category === cat).length})
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 py-2 px-2.5 rounded-xl focus:outline-hidden cursor-pointer"
            >
              <option value="category">Sort: Category</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="qty_desc">Sort: Quantity (High → Low)</option>
              <option value="shelf_stable">Sort: Shelf-Stable</option>
            </select>

            {/* View Mode Toggle */}
            <div className="col-span-2 sm:col-span-1 flex items-center justify-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  viewMode === 'table' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Master Table View"
              >
                <Table className="w-3.5 h-3.5 shrink-0" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  viewMode === 'cards' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Category Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span>Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Tally Chips */}
        <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="font-semibold text-slate-800">
              Showing {filteredInventory.length} of {inventory.length} items
            </span>
            <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px] border border-emerald-200">
              🌿 {shelfStableCount} Shelf-Stable
            </span>
            {perishableCount > 0 && (
              <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px] border border-amber-200">
                ⏳ {perishableCount} Perishables
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Table className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Master Pantry Inventory Table ({filteredInventory.length} Items)</span>
            </h3>
            <span className="text-[11px] text-slate-500 flex items-center space-x-1">
              <span>👉 Swipe horizontally for all item controls</span>
            </span>
          </div>

          <div className="relative overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
            <table className="w-full text-left border-collapse min-w-[780px] text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-bold border-b border-slate-800">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3.5 sticky left-0 z-20 bg-slate-900 min-w-[180px] border-r border-slate-800">
                    Item Name
                  </th>
                  <th className="py-3 px-3 min-w-[140px]">Category</th>
                  <th className="py-3 px-3 min-w-[110px] text-right">In Stock Qty</th>
                  <th className="py-3 px-3 min-w-[130px] text-center">Storage Type</th>
                  <th className="py-3 px-3 min-w-[120px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInventory.map((item, idx) => {
                  const isEditing = editingItemId === item.id;
                  const catInfo = categoriesMap[item.category] || { label: item.category, icon: '📦' };

                  if (isEditing) {
                    return (
                      <tr key={item.id} className="bg-emerald-50/90 font-medium">
                        <td className="p-3 text-center align-middle text-slate-500 font-bold">{idx + 1}</td>
                        <td className="p-3 sticky left-0 z-10 bg-emerald-50 border-r border-emerald-200">
                          <input
                            type="text"
                            value={editItemData?.name || ''}
                            onChange={(e) =>
                              setEditItemData((prev) => (prev ? { ...prev, name: e.target.value } : null))
                            }
                            className="w-full px-2 py-1 text-xs border border-emerald-300 rounded-lg bg-white font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={editItemData?.category || 'pulses_legumes'}
                            onChange={(e) =>
                              setEditItemData((prev) =>
                                prev ? { ...prev, category: e.target.value as PantryItem['category'] } : null
                              )
                            }
                            className="w-full px-2 py-1 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-hidden"
                          >
                            <option value="pulses_legumes">🫘 Pulses & Soya</option>
                            <option value="grains_flours">🌾 Grains & Atta</option>
                            <option value="seeds_nuts">🥜 Seeds & Nuts</option>
                            <option value="fresh_produce">🧅 Produce</option>
                            <option value="dairy_alternatives">🥛 Dairy</option>
                            <option value="spices_others">🧂 Spices</option>
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex space-x-1 justify-end">
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
                              className="w-16 px-1.5 py-1 text-xs border border-emerald-300 rounded-lg bg-white font-semibold text-right"
                            />
                            <select
                              value={editItemData?.unit || 'g'}
                              onChange={(e) =>
                                setEditItemData((prev) => (prev ? { ...prev, unit: e.target.value } : null))
                              }
                              className="w-14 px-1 py-1 text-xs border border-emerald-300 rounded-lg bg-white"
                            >
                              <option value="g">g</option>
                              <option value="kg">kg</option>
                              <option value="pcs">pcs</option>
                              <option value="L">L</option>
                              <option value="ml">ml</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <label className="inline-flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
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
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={handleSaveEdit}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                      } hover:bg-emerald-50/30`}
                    >
                      <td className="p-3 text-center align-middle text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      {/* Sticky Item Column */}
                      <td className="p-3 font-bold sticky left-0 z-10 bg-white border-r border-slate-200 text-slate-900">
                        <span>{item.name}</span>
                      </td>

                      {/* Category */}
                      <td className="p-3 align-middle">
                        <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md text-[11px]">
                          <span>{catInfo.icon}</span>
                          <span>{catInfo.label}</span>
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="p-3 text-right align-middle">
                        <span className="font-extrabold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          {item.quantity} {item.unit}
                        </span>
                      </td>

                      {/* Shelf Stable */}
                      <td className="p-3 text-center align-middle">
                        {item.isShelfStable ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Shield className="w-3 h-3 text-emerald-600" />
                            <span>Shelf-Stable</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Perishable</span>
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="p-3 text-center align-middle">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Edit item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-slate-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CARDS VIEW (Categorized Grid) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(Object.keys(categoriesMap) as Array<PantryItem['category']>).map((cat) => {
            const catInfo = categoriesMap[cat];
            const itemsInCat = filteredInventory.filter((item) => item.category === cat);

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
                  <p className="text-[11px] text-slate-400 italic py-2">No items matching criteria.</p>
                ) : (
                  <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
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
                                className="w-full px-2 py-1 text-xs border border-emerald-300 rounded-lg bg-white font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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
                                    className="w-1/2 px-2 py-1 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold"
                                  />
                                  <select
                                    value={editItemData?.unit || 'g'}
                                    onChange={(e) =>
                                      setEditItemData((prev) => (prev ? { ...prev, unit: e.target.value } : null))
                                    }
                                    className="w-1/2 px-2 py-1 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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
                                  className="w-full px-2 py-1 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md transition-colors flex items-center space-x-1 text-[11px] font-semibold shadow-2xs cursor-pointer"
                                  title="Save changes"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Save</span>
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded-md transition-colors flex items-center space-x-1 text-[11px] font-semibold cursor-pointer"
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
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 hover:bg-emerald-50/50 transition-colors border border-slate-100 group text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{item.name}</span>
                            <div className="text-[10px] text-slate-500">
                              Quantity: <strong className="text-slate-700">{item.quantity} {item.unit}</strong>
                              {item.isShelfStable && <span className="ml-2 text-emerald-700 font-medium"> (Shelf-stable)</span>}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-all shrink-0">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-md transition-colors cursor-pointer"
                              title="Edit item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded-md transition-colors cursor-pointer"
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
      )}
    </div>
  );
};
