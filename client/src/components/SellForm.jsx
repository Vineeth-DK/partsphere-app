import React, { useState, useEffect } from 'react';
import { Upload, X, Tag, CalendarRange, Truck, Wrench } from 'lucide-react';
import api from '../utils/api';

const EQUIPMENT_CATS = [
  "Aerial Work Platforms", "Earth Moving", "Construction Equipments",
  "Concrete & Masonry", "Lifting Equipments", "Agriculture Equipments", "Others"
];

const PART_CATS = [
  "Hydraulics", "Engine Parts", "Undercarriage", "Filters", "Electrical", "Others"
];

const SellForm = ({ location, onClose, onRefresh, user }) => {
  const [listingType, setListingType] = useState('RENT'); 
  const [itemType, setItemType] = useState('Equipment'); // 'Equipment' vs 'Part'
  
  const [formData, setFormData] = useState({
    title: '', 
    description: '', 
    model_number: '',   // Equipment Specific
    part_number: '',    // Part Specific
    subcategory: '',    // Category from list
    price_day: '', 
    price_week: '', 
    price_month: '', 
    image: null
  });
  
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset category when type changes
  useEffect(() => {
      setFormData(prev => ({
          ...prev, 
          subcategory: itemType === 'Equipment' ? EQUIPMENT_CATS[0] : PART_CATS[0]
      }));
  }, [itemType]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
        setFormData({ ...formData, image: file });
        setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    
    // Common Fields
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', itemType);
    data.append('subcategory', formData.subcategory);
    data.append('location', location);
    data.append('user_id', user?.id || 1);
    data.append('listing_type', listingType);

    // Conditional Fields
    if (itemType === 'Equipment') {
        data.append('part_number', formData.model_number); // Reusing DB column for Model No
    } else {
        data.append('part_number', formData.part_number);
    }

    // Pricing Logic
    data.append('price_day', formData.price_day);
    if (listingType === 'RENT') {
        data.append('price_week', formData.price_week);
        data.append('price_month', formData.price_month);
    } else {
        data.append('price_week', 0);
        data.append('price_month', 0);
    }

    if (formData.image) data.append('image', formData.image);
    else { alert("Image is mandatory"); setLoading(false); return; }

    try {
      await api.post('/parts', data);
      onRefresh(); onClose();
    } catch (err) {
      alert('Error uploading. Check console.');
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl w-full max-w-2xl p-0 relative shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">List New Asset</h2>
                <p className="text-sm text-slate-500">Fill details to publish your listing in {location}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X className="text-slate-500" /></button>
        </div>

        <div className="overflow-y-auto p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Main Toggles */}
            <div className="grid grid-cols-2 gap-4">
                {/* Type Toggle */}
                <div className="flex p-1 bg-slate-100 rounded-lg">
                    <button type="button" onClick={() => setItemType('Equipment')} 
                        className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${itemType === 'Equipment' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>
                        <Truck size={18} /> Equipment
                    </button>
                    <button type="button" onClick={() => setItemType('Part')} 
                        className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${itemType === 'Part' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>
                        <Wrench size={18} /> Spare Part
                    </button>
                </div>
                
                {/* Rent/Sell Toggle */}
                <div className="flex p-1 bg-slate-100 rounded-lg">
                    <button type="button" onClick={() => setListingType('RENT')} 
                        className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${listingType === 'RENT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                        <CalendarRange size={18} /> Rent Out
                    </button>
                    <button type="button" onClick={() => setListingType('SELL')} 
                        className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${listingType === 'SELL' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}>
                        <Tag size={18} /> Sell Item
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-8">
                {/* Image Upload */}
                <div className="h-40 w-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center hover:bg-slate-50 cursor-pointer relative overflow-hidden group transition-colors">
                    <input type="file" onChange={handleImage} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    {preview ? (
                        <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                        <>
                            <Upload className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                            <span className="text-xs text-slate-400 font-bold uppercase">Add Photo *</span>
                        </>
                    )}
                </div>

                {/* Dynamic Fields based on Type */}
                <div className="space-y-5">
                    <input placeholder={itemType === 'Equipment' ? "Machine Name (e.g. JCB 3DX)" : "Part Name (e.g. Hydraulic Pump)"} 
                        className="w-full border p-3 rounded-lg focus:ring-2 ring-blue-500 outline-none font-bold text-lg" 
                        value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                    
                    <div className="grid grid-cols-2 gap-4">
                        {/* Subcategory Select */}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                            <select className="w-full border p-3 rounded-lg bg-white outline-none text-sm font-medium"
                                value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value})}>
                                {(itemType === 'Equipment' ? EQUIPMENT_CATS : PART_CATS).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Conditional Input: Model No OR Part No */}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                {itemType === 'Equipment' ? 'Model Number' : 'Part Number (Optional)'}
                            </label>
                            <input 
                                placeholder={itemType === 'Equipment' ? "e.g. 3DX-Super" : "e.g. 123-ABC-456"} 
                                className="w-full border p-3 rounded-lg outline-none text-sm font-medium" 
                                required={itemType === 'Equipment'}
                                value={itemType === 'Equipment' ? formData.model_number : formData.part_number} 
                                onChange={e => itemType === 'Equipment' ? setFormData({...formData, model_number: e.target.value}) : setFormData({...formData, part_number: e.target.value})} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description & Specs</label>
                <textarea className="w-full border p-3 rounded-lg h-24 text-sm outline-none focus:border-blue-500" 
                    placeholder={itemType === 'Equipment' ? "Condition, Engine hours, Attachments included..." : "Compatibility, Condition (New/Used), Warranty..."}
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required 
                />
            </div>
            
            {/* Pricing Section */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                {listingType === 'SELL' ? (
                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Total Selling Price (₹)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 text-slate-400 font-bold">₹</span>
                            <input type="number" className="w-full border p-3 pl-8 rounded-lg text-xl font-black text-green-700 outline-none" required
                                value={formData.price_day} onChange={e => setFormData({...formData, price_day: e.target.value})} />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Daily Rate (₹)</label>
                            <input type="number" className="w-full border p-3 rounded-lg font-bold text-slate-700 outline-none" required
                                value={formData.price_day} onChange={e => setFormData({...formData, price_day: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Weekly Rate</label>
                            <input type="number" className="w-full border p-3 rounded-lg font-medium text-slate-600 outline-none" placeholder="Optional"
                                value={formData.price_week} onChange={e => setFormData({...formData, price_week: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Monthly Rate</label>
                            <input type="number" className="w-full border p-3 rounded-lg font-medium text-slate-600 outline-none" placeholder="Optional"
                                value={formData.price_month} onChange={e => setFormData({...formData, price_month: e.target.value})} />
                        </div>
                    </div>
                )}
            </div>

            <button disabled={loading} className={`w-full text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.99] ${listingType === 'SELL' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {loading ? 'Publishing Asset...' : (listingType === 'SELL' ? 'Post for Sale' : 'List for Rent')}
            </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default SellForm;