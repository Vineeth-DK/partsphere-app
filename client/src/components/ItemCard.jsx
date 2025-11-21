import React from 'react';
import { Star, CheckCircle2, MapPin, ArrowRight, Pencil, Trash2, Tag, Clock } from 'lucide-react';
import { getImageUrl } from '../utils/api';

const ItemCard = ({ part, onAddToCart, currentUser, onEdit, onDelete }) => {
  const imageUrl = getImageUrl(part.image_url);
  const owner = part.User || { name: 'Unknown', is_verified: false, avg_rating: 0, avg_response_minutes: 60 };
  const isSale = part.listing_type === 'SELL';

  const isOwner = currentUser && currentUser.id === part.UserId;

  const formatPrice = (p) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(p);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-0 flex flex-col sm:flex-row overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 group h-auto sm:h-52">
      
      {/* Image Section */}
      <div className="w-full sm:w-72 h-48 sm:h-auto bg-slate-100 relative shrink-0">
        <img src={imageUrl} alt={part.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <span className={`absolute top-3 left-3 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md uppercase tracking-wider
            ${part.category === 'Equipment' ? 'bg-slate-900/80' : 'bg-orange-600/80'}`}>
          {part.subcategory || part.category}
        </span>
        {isSale && <span className="absolute bottom-3 right-3 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-md">For Sale</span>}
      </div>

      {/* Content Section */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        
        <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors truncate" title={part.title}>
                    {part.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-1">PN: {part.part_number || 'N/A'}</p>
            </div>
            
            <div className="text-right shrink-0">
                <div className={`text-2xl font-black leading-none ${isSale ? 'text-green-600' : 'text-blue-600'}`}>
                    {formatPrice(part.price_day)}
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{isSale ? 'Full Price' : '/ Day'}</span>
                
                {!isSale && (
                    <div className="flex gap-2 mt-1 justify-end text-[10px] text-slate-400">
                       <span>W: {formatPrice(part.price_week)}</span>
                       <span>M: {formatPrice(part.price_month)}</span>
                    </div>
                )}
            </div>
        </div>

        <p className="text-sm text-slate-600 line-clamp-2 my-2">{part.description}</p>

        <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-100">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    {owner.is_verified && <CheckCircle2 size={14} className="text-blue-500" />}
                    {owner.name} {isOwner && <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">(You)</span>}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Star size={10} className="text-yellow-500 fill-current"/> {owner.avg_rating}</span>
                    <span className="flex items-center gap-1"><MapPin size={10} /> {part.location}</span>
                    <span className="flex items-center gap-1 text-green-600"><Clock size={10} /> {owner.avg_response_minutes}m</span>
                </div>
            </div>

            {/* --- OWNER ACTIONS VS BUYER ACTIONS --- */}
            {isOwner ? (
                <div className="flex gap-2">
                    <button onClick={onEdit} className="flex items-center gap-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-slate-200">
                        <Pencil size={14} /> Edit
                    </button>
                    <button onClick={onDelete} className="flex items-center gap-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-slate-200">
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            ) : (
                <button onClick={() => onAddToCart(part)} 
                    className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md hover:shadow-lg
                    ${isSale ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-900 hover:bg-blue-600'}`}>
                    {isSale ? <Tag size={14} /> : <ArrowRight size={14} />}
                    {isSale ? 'Buy Now' : 'Reserve'}
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default ItemCard;