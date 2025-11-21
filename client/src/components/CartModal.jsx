import React, { useState } from 'react';
import { X, Trash2, CreditCard, ShieldCheck } from 'lucide-react';
import api, { getImageUrl } from '../utils/api';

const CartModal = ({ cart, removeFromCart, onClose, lang, labels, user, onLoginRequest }) => {
  const [processing, setProcessing] = useState(false);

  const total = cart.reduce((sum, item) => sum + (item.price_day || item.price || 0), 0);
  const formattedTotal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(total);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // --- GATEKEEPER: CHECK LOGIN ---
    if (!user) {
        onLoginRequest(); // Trigger the login popup in App.jsx
        return;
    }

    setProcessing(true);

    const res = await loadRazorpay();
    if (!res) {
      alert('Razorpay SDK failed to load.');
      setProcessing(false);
      return;
    }

    try {
        const result = await api.post('/create-order', { amount: total });
        const { amount, id: order_id, currency } = result.data;

        const options = {
            key: "PASTE_YOUR_KEY_ID_HERE", // <--- KEEP YOUR KEY HERE
            amount: amount.toString(),
            currency: currency,
            name: "PartSphere Market",
            description: `Payment for ${cart.length} Items`,
            order_id: order_id,
            handler: async function (response) {
                await api.post('/verify-payment', response);
                alert(`Payment Successful! Ref: ${response.razorpay_payment_id}`);
                onClose();
            },
            prefill: {
                name: user.name, // Use real user name
                email: user.email, // Use real user email
                contact: "9999999999",
            },
            theme: { color: "#2563eb" },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
        
    } catch (err) {
        console.error("Checkout Error:", err);
        alert("Could not initiate payment.");
    } finally {
        setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">{labels?.['Cart'] || 'Cart'} ({cart.length})</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                    <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>{labels?.['Empty Cart'] || 'Your cart is empty'}</p>
                </div>
            ) : (
                cart.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex gap-4 border border-gray-100 p-3 rounded-lg shadow-sm">
                        <img 
                            src={getImageUrl(item.image_url)} 
                            className="w-20 h-20 object-cover rounded-md bg-gray-100"
                            alt={item.title}
                        />
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-800 line-clamp-1">{item.title}</h4>
                            <p className="text-brand-600 font-bold text-sm">₹{(item.price_day || item.price).toLocaleString('en-IN')}/day</p>
                            <p className="text-xs text-gray-400 mt-1">{item.location}</p>
                        </div>
                        <button onClick={() => removeFromCart(index)} className="text-red-400 hover:text-red-600 self-center">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))
            )}
        </div>

        <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-4 text-lg font-bold">
                <span>{labels?.['Total'] || 'Total'}</span>
                <span className="text-brand-600">{formattedTotal}</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded mb-4 border border-green-100">
                <ShieldCheck size={16} />
                <span>Funds held in Escrow until item received.</span>
            </div>

            <button 
                onClick={handleCheckout}
                disabled={processing || cart.length === 0}
                className="w-full bg-black text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50"
            >
                {processing ? 'Processing...' : (
                    <>
                        <CreditCard size={20} /> {user ? 'Pay with Razorpay' : 'Login to Pay'}
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;