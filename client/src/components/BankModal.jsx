import React, { useState } from 'react';
import { X, CreditCard, Landmark, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import api from '../utils/api';

const BankModal = ({ mode, onClose, onSuccess }) => {
    // mode = 'DEPOSIT' or 'WITHDRAW'
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState('');
    
    const [formData, setFormData] = useState({
        amount: '',
        accountNumber: '',
        cardNumber: '', // Only for Deposit
        expiry: '',     // Only for Deposit
        cvv: ''         // Only for Deposit
    });

    const handleSendOtp = async () => {
        if (!formData.amount || !formData.accountNumber) return alert("Please fill details");
        if (mode === 'DEPOSIT' && !formData.cardNumber) return alert("Card details required");
        
        setLoading(true);
        try {
            // Simulate Bank OTP Request
            await api.post('/bank/otp', { amount: formData.amount });
            alert("Bank OTP Sent! (Check Backend Console)");
            setStep(2);
        } catch (e) { alert("Bank Server Error"); }
        finally { setLoading(false); }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const endpoint = mode === 'DEPOSIT' ? '/wallet/deposit' : '/wallet/withdraw';
            
            await api.post(endpoint, {
                amount: parseInt(formData.amount),
                account_number: formData.accountNumber,
                otp: mode === 'DEPOSIT' ? otp : null // Withdraw doesn't need OTP in this flow
            });
            
            alert(mode === 'DEPOSIT' ? "Money Added Successfully!" : "Withdrawal Successful!");
            onSuccess();
            onClose();
        } catch (e) {
            alert(e.response?.data?.error || "Transaction Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X /></button>
                
                <div className="bg-slate-50 p-6 border-b text-center">
                    <h2 className="text-xl font-black text-slate-900">
                        {mode === 'DEPOSIT' ? 'Add Money to Wallet' : 'Withdraw to Bank'}
                    </h2>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-1">Secure Gateway</p>
                </div>

                <div className="p-8">
                    
                    {/* STEP 1: DETAILS */}
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount (₹)</label>
                                <input type="number" className="w-full p-3 border-2 border-slate-200 rounded-xl text-2xl font-black text-slate-800 focus:border-blue-500 outline-none" 
                                    placeholder="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} autoFocus />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bank Account Number</label>
                                <div className="relative">
                                    <Landmark className="absolute left-3 top-3 text-slate-400" size={18}/>
                                    <input className="w-full p-3 pl-10 border rounded-lg outline-none focus:border-blue-500 font-mono" 
                                        placeholder="XXXXXXXXXXXX" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} />
                                </div>
                            </div>

                            {mode === 'DEPOSIT' && (
                                <div className="space-y-4 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                                        <CreditCard size={14} /> Debit/Credit Card
                                    </div>
                                    <input className="w-full p-3 border rounded-lg outline-none focus:border-blue-500 font-mono" 
                                        placeholder="Card Number" value={formData.cardNumber} onChange={e => setFormData({...formData, cardNumber: e.target.value})} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input className="p-3 border rounded-lg outline-none" placeholder="MM/YY" />
                                        <input className="p-3 border rounded-lg outline-none" placeholder="CVV" type="password" />
                                    </div>
                                </div>
                            )}

                            <button onClick={mode === 'DEPOSIT' ? handleSendOtp : handleSubmit} disabled={loading} 
                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-black transition-all mt-4 flex justify-center items-center gap-2">
                                {loading ? 'Processing...' : (mode === 'DEPOSIT' ? 'Request OTP' : 'Confirm Withdrawal')}
                                {!loading && <ArrowRight size={16} />}
                            </button>
                        </div>
                    )}

                    {/* STEP 2: OTP (DEPOSIT ONLY) */}
                    {step === 2 && mode === 'DEPOSIT' && (
                        <div className="text-center space-y-6 animate-fade-in">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                                <Lock size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Enter Bank OTP</h3>
                                <p className="text-sm text-slate-500">Check your terminal/mobile</p>
                            </div>
                            
                            <input className="w-full p-4 text-center text-3xl font-black tracking-[0.5em] border-2 border-blue-100 rounded-xl focus:border-blue-600 outline-none" 
                                placeholder="XXXX" maxLength={4} value={otp} onChange={e => setOtp(e.target.value)} autoFocus />

                            <button onClick={handleSubmit} disabled={loading} 
                                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all">
                                {loading ? 'Verifying...' : 'Confirm Deposit'}
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="bg-slate-50 p-3 text-center text-[10px] text-slate-400 font-bold uppercase flex justify-center items-center gap-2">
                    <ShieldCheck size={12} /> 256-bit Secure Transaction
                </div>
            </div>
        </div>
    );
};

export default BankModal;