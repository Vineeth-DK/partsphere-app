import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ItemCard from './ItemCard';
import { Package, Plus } from 'lucide-react';

const MyListings = ({ user, onEdit, onDelete, onSellClick }) => {
    const [myItems, setMyItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch items owned by this user
    useEffect(() => {
        if (user) {
            api.get(`/parts?user_id=${user.id}`)
                .then(res => setMyItems(res.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [user]);

    if (loading) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Loading your inventory...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 min-h-[60vh]">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900">My Inventory</h2>
                    <p className="text-slate-500">Manage your listed equipment and spare parts.</p>
                </div>
                <button onClick={onSellClick} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 transition-all active:scale-95">
                    <Plus size={18} /> Add New Asset
                </button>
            </div>

            {myItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 animate-fade-in">
                    {myItems.map(item => (
                        <ItemCard 
                            key={item.id} 
                            part={item} 
                            currentUser={user} // This triggers the Edit/Delete mode in ItemCard
                            onEdit={() => onEdit(item)}
                            onDelete={() => onDelete(item.id)}
                            // No cart action needed for own items
                            onAddToCart={() => {}} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6">
                        <Package size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-700 mb-2">No listings found</h3>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">You haven't listed any equipment or parts yet. Start monetizing your idle assets today.</p>
                    <button onClick={onSellClick} className="text-blue-600 font-bold hover:text-blue-800 underline">Create your first listing</button>
                </div>
            )}
        </div>
    );
};

export default MyListings;