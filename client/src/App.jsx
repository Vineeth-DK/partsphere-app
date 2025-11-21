import React, { useState, useEffect } from 'react';
import api from './utils/api';
import LocationModal from './components/LocationModal';
import Navbar from './components/Navbar';
import ItemCard from './components/ItemCard';
import SellForm from './components/SellForm';
import CartModal from './components/CartModal';
import LoginModal from './components/LoginModal';
import RentalWizard from './components/RentalWizard';
import Dashboard from './components/Dashboard';
import ChatSystem from './components/ChatSystem';
import AdminDashboard from './components/AdminDashboard';
import VerificationModal from './components/VerificationModal';
import { Search, ArrowRight } from 'lucide-react';

// CATEGORY DATA (Using local assets in public folder)
const CATEGORIES = [
    { 
      id: 'aerial', 
      name: 'Aerial Work Platforms', 
      img: '/assets/download (8).jpg' 
    },
    { 
      id: 'earth', 
      name: 'Earth Moving', 
      img: '/assets/360_F_1706503325_elpoS8pNuv3neiwG6MDgULF7uREq75qM.jpg' 
    },
    { 
      id: 'concrete', 
      name: 'Concrete & Masonry', 
      img: '/assets/download (1) (1).jpg' 
    },
    { 
      id: 'lifting', 
      name: 'Lifting Equipments', 
      img: '/assets/robot-with-glowing-lights-back-it_687292-11182.avif' 
    },
    { 
      id: 'agri', 
      name: 'Agriculture Equipments', 
      img: '/assets/images (1).jpg' 
    },
    { 
      id: 'other', 
      name: 'Others', 
      img: '/assets/outdoor-photo-underground-copper-cables-600nw-2617487469.webp' 
    }
];

function App() {
  const [location, setLocation] = useState(localStorage.getItem('ps_loc') || '');
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  
  const [activeTab, setActiveTab] = useState('Equipment'); 
  // View States: 'HOME', 'LISTING', 'DASHBOARD'
  const [viewState, setViewState] = useState(location ? 'HOME' : 'INIT'); 
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [showLocationModal, setShowLocationModal] = useState(!localStorage.getItem('ps_loc'));
  const [showSellForm, setShowSellForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  
  const [cart, setCart] = useState([]);
  const [wizardItem, setWizardItem] = useState(null); 
  
  // 1. CHECK ADMIN ROUTE FIRST
  const isAdminRoute = window.location.pathname === '/admin';

  useEffect(() => {
    const u = localStorage.getItem('user_data');
    const t = localStorage.getItem('token');
    if (u && t) setUser(JSON.parse(u));
  }, []);

  const fetchItems = (subcategory = '', query = '') => {
    if (!location) return;
    let endpoint = `/parts?location=${location}`;
    
    if (!query && !subcategory) {
        endpoint += `&category=${activeTab}`;
    }
    
    if (subcategory) endpoint += `&subcategory=${subcategory}`;
    if (query) endpoint += `&search=${query}`;
    
    api.get(endpoint).then(res => setItems(res.data)).catch(console.error);
  };

  // --- GATEKEEPER ---
  const checkVerification = () => {
      if (!user) { setShowLogin(true); return false; }
      if (user.name === 'Admin') return true; 
      if (!user.is_verified) {
          setShowVerification(true);
          return false;
      }
      return true;
  };

  // --- HANDLERS ---
  const handleSellClick = () => {
      if (checkVerification()) {
          setEditItem(null);
          setShowSellForm(true);
      }
  };

  const handleAddToCart = (item) => {
      if (checkVerification()) {
          setWizardItem(item);
      }
  };

  const handleLogoClick = () => { setViewState('HOME'); setSelectedCategory(null); };
  
  const handleTabClick = (tab) => { 
      setActiveTab(tab); 
      setSelectedCategory(null); 
      setViewState('LISTING'); 
      api.get(`/parts?location=${location}&category=${tab}`).then(res => setItems(res.data)); 
  };
  
  const handleSearch = (query) => { 
      setViewState('LISTING'); 
      setSelectedCategory({ name: `Search: "${query}"` }); 
      fetchItems('', query); 
  };
  
  const handleCategoryClick = (cat) => { 
      setSelectedCategory(cat); 
      setViewState('LISTING'); 
      fetchItems(cat.name); 
  };
  
  const handleLocationSet = (loc) => { 
      setLocation(loc); 
      localStorage.setItem('ps_loc', loc); 
      setShowLocationModal(false); 
      setViewState('HOME'); 
  };
  
  const handleEditClick = (item) => { 
      setEditItem(item); 
      setShowSellForm(true); 
  };
  
  const handleDeleteClick = async (itemId) => { 
      if (window.confirm("Delete this listing?")) { 
          try { await api.delete(`/parts/${itemId}`); fetchItems(); } 
          catch (err) { alert("Failed to delete"); }
      } 
  };

  // 2. RENDER ADMIN DASHBOARD EXCLUSIVELY
  if (isAdminRoute) return <AdminDashboard />;

  // 3. RENDER REGULAR APP
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 relative">
      
      {user && <ChatSystem user={user} />}
      
      {!location && <div className="fixed inset-0 z-40 bg-white/30 backdrop-blur-md"></div>}

      {showLocationModal && <LocationModal onSetLocation={handleLocationSet} force={!location} onClose={() => setShowLocationModal(false)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={(u) => { setUser(u); setShowLogin(false); }} />}
      {showVerification && <VerificationModal onClose={() => setShowVerification(false)} onComplete={() => window.location.reload()} />}
      
      {showCart && <CartModal cart={cart} removeFromCart={(idx) => { const n = [...cart]; n.splice(idx, 1); setCart(n); }} onClose={() => setShowCart(false)} user={user} />}
      
      {showSellForm && <SellForm location={location} user={user} editItem={editItem} onClose={() => setShowSellForm(false)} onRefresh={() => fetchItems()} />}
      
      {wizardItem && <RentalWizard item={wizardItem} user={user} onClose={() => setWizardItem(null)} 
          onComplete={(data) => { setCart([...cart, { ...wizardItem, ...data }]); setWizardItem(null); }} mode="ADD_TO_CART" />}

      <Navbar 
        location={location} 
        user={user} 
        onLogoClick={handleLogoClick} 
        onTabClick={handleTabClick} 
        onSearch={handleSearch} 
        onMyListingsClick={() => setViewState('DASHBOARD')} 
        onSellClick={handleSellClick} 
        cartCount={cart.length} 
        openCart={() => setShowCart(true)} 
        openLogin={() => setShowLogin(true)} 
        onLogout={() => { setUser(null); localStorage.clear(); setViewState('HOME'); }} 
        onLocationClick={() => setShowLocationModal(true)} 
        activeTab={activeTab} 
        onVerifyClick={() => setShowVerification(true)}
      />

      <main className={`max-w-7xl mx-auto p-6 ${!location ? 'blur-sm pointer-events-none' : ''}`}>
        
        {viewState === 'DASHBOARD' && <Dashboard user={user} onEdit={handleEditClick} onDelete={handleDeleteClick} />}
        
        {viewState === 'HOME' && (
            <div className="animate-fade-in">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white mb-12 shadow-2xl overflow-hidden relative">
                    <div className="relative z-10 max-w-2xl">
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
                            Power Your Project with <span className="text-blue-400">PartSphere</span>
                        </h1>
                        <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                            India's premier marketplace for heavy machinery rental and spare parts exchange. 
                            We connect contractors directly with verified equipment owners.
                        </p>
                    </div>
                    <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><span className="w-2 h-8 bg-blue-600 rounded-full"></span> Browse by Category</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CATEGORIES.map(cat => (
                        <div key={cat.id} onClick={() => handleCategoryClick(cat)} className="group cursor-pointer relative h-64 overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all border border-slate-200">
                            <img src={cat.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={cat.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                                <h3 className="text-white font-bold text-2xl mb-1">{cat.name}</h3>
                                <p className="text-slate-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">View Inventory <ArrowRight size={12} className="inline" /></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {viewState === 'LISTING' && (
            <div className="animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={handleLogoClick} className="text-slate-500 hover:text-slate-900 font-bold flex items-center gap-1 transition-colors">&larr; Back to Home</button>
                    <h2 className="text-2xl font-bold text-slate-800">{selectedCategory ? selectedCategory.name : `${activeTab}s`} <span className="text-slate-400 font-normal ml-2 text-lg">in {location}</span></h2>
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full ml-auto">{items.length} Found</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {items.length > 0 ? items.map(item => (
                        <ItemCard 
                            key={item.id} 
                            part={item} 
                            currentUser={user} 
                            onEdit={() => handleEditClick(item)} 
                            onDelete={() => handleDeleteClick(item.id)} 
                            onAddToCart={(i) => handleAddToCart(i)} 
                        />
                    )) : (
                        <div className="text-center py-24 text-slate-400 border-2 border-dashed rounded-xl bg-white">
                            <Search size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No items found.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

export default App;