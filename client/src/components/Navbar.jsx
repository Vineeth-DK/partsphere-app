import React, { useState } from 'react';
import { Search, PlusCircle, ShoppingCart, User, MapPin, LogOut, LayoutDashboard, ShieldAlert, Clock, CheckCircle } from 'lucide-react';

const Navbar = ({ 
  location, user, onSearch, onSellClick, cartCount, 
  openCart, openLogin, onLogout, onLocationClick,
  activeTab, onTabClick, onMyListingsClick, onLogoClick,
  onVerifyClick // New Prop for opening Verification Modal
}) => {
  
  const [term, setTerm] = useState('');

  return (
    <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 py-3 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo & Search */}
          <div className="flex flex-1 w-full md:w-auto items-center justify-between md:justify-start gap-8">
            <div className="flex items-center gap-1 cursor-pointer group" onClick={onLogoClick}> 
                <div className="bg-blue-600 text-white font-black text-lg p-1.5 rounded-lg group-hover:rotate-3 transition-transform">PS</div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-900">
                    PartSphere
                </h1>
            </div>

            <form onSubmit={(e) => {e.preventDefault(); onSearch(term)}} 
                  className="hidden md:flex items-center bg-slate-100 px-4 py-2.5 rounded-full flex-1 max-w-md border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all">
                 <Search className="text-slate-400 w-4 h-4" />
                 <input className="bg-transparent border-none focus:outline-none ml-3 w-full text-sm font-medium text-slate-700" 
                   placeholder="Search machines, parts, models..." value={term} onChange={e => setTerm(e.target.value)} />
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end">
             
             {/* Tab Switcher */}
             <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                <button onClick={() => onTabClick('Equipment')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'Equipment' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Equipments</button>
                <button onClick={() => onTabClick('Part')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'Part' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Parts</button>
             </div>

             <div className="hidden md:flex h-6 w-px bg-slate-200"></div>

             <button onClick={onLocationClick} className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 whitespace-nowrap bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-200 transition-all">
                <MapPin size={14} className="text-blue-500" /> {location || 'Loc'}
             </button>

             {/* User & Cart */}
             <div className="flex items-center gap-3">
                {user ? (
                    <div className="flex items-center gap-2 bg-slate-50 p-1 pl-1 pr-1 rounded-full border border-slate-200">
                        
                        {/* --- VERIFICATION STATUS LOGIC --- */}
                        {user.is_verified ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full flex items-center gap-1" title="Verified User">
                                <CheckCircle size={10}/>
                            </span>
                        ) : user.verification_status === 'PENDING' ? (
                             <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full flex items-center gap-1 cursor-help" title="Verification Pending Approval">
                                <Clock size={10}/> Pending
                            </span>
                        ) : (
                            <button onClick={onVerifyClick} className="px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 text-[10px] font-bold rounded-full flex items-center gap-1 animate-pulse" title="Click to Verify">
                                <ShieldAlert size={10}/> Verify Now
                            </button>
                        )}

                        <span className="text-xs font-bold text-slate-700 truncate max-w-[80px] px-2">
                            {user.name.split(' ')[0]}
                        </span>
                        <button onClick={onMyListingsClick} className="p-1.5 rounded-full hover:bg-white hover:text-blue-600 transition-colors text-slate-400" title="My Inventory"><LayoutDashboard size={16} /></button>
                        <button onClick={onLogout} className="p-1.5 rounded-full hover:bg-white hover:text-red-500 transition-colors text-slate-400" title="Logout"><LogOut size={16} /></button>
                    </div>
                ) : (
                    <button onClick={openLogin} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold text-xs px-2"><User size={18} /> Login</button>
                )}

                <button onClick={openCart} className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ShoppingCart size={22} className="text-slate-700" />
                    {cartCount > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{cartCount}</span>}
                </button>

                <button onClick={onSellClick} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-200 transition-all flex items-center gap-2 active:scale-95"><PlusCircle size={16} /> List Item</button>
             </div>
          </div>
      </div>
      
      <form onSubmit={(e) => {e.preventDefault(); onSearch(term)}} className="md:hidden mt-3 flex items-center bg-slate-100 px-4 py-3 rounded-xl border border-transparent focus-within:border-blue-500 transition-all">
         <Search className="text-slate-400 w-5 h-5" />
         <input className="bg-transparent border-none focus:outline-none ml-3 w-full text-sm font-medium" 
           placeholder="Search..." value={term} onChange={e => setTerm(e.target.value)} />
      </form>
    </nav>
  );
};

export default Navbar;