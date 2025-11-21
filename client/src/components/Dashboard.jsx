import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ItemCard from './ItemCard';
import ReviewModal from './ReviewModal';
import BankModal from './BankModal'; // NEW IMPORT
import { Wallet, Info, Star, CheckCircle, PackageCheck, Plus, ArrowUpRight } from 'lucide-react';

const Dashboard = ({ user, onEdit, onDelete }) => {
    const [activeTab, setActiveTab] = useState('LISTINGS');
    const [myItems, setMyItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [reviewOrder, setReviewOrder] = useState(null);
    
    // Bank Modal State
    const [bankMode, setBankMode] = useState(null); // 'DEPOSIT' or 'WITHDRAW'

    useEffect(() => { fetchDashboardData(); }, [activeTab]);

    const fetchDashboardData = async () => {
        try {
            if (activeTab === 'LISTINGS') {
                const res = await api.get(`/parts?user_id=${user.id}`);
                setMyItems(res.data);
            } else if (activeTab === 'ORDERS') {
                const res = await api.get('/orders');
                setOrders(res.data);
            } else if (activeTab === 'WALLET') {
                const res = await api.get('/user/me');
                setWalletBalance(res.data.wallet_balance);
            }
        } catch (e) { console.error(e); }
    };

    const handleApprove = async (orderId) => { await api.post(`/orders/${orderId}/approve`); fetchDashboardData(); alert("Order Approved!"); };
    const handlePay = async (orderId) => { try { await api.post('/wallet/pay', { order_id: orderId }); alert("Paid! Funds held in Escrow."); fetchDashboardData(); } catch (e) { alert(e.response?.data?.error || "Payment failed"); } };
    const handleConfirm = async (orderId) => { await api.post(`/orders/${orderId}/confirm`); fetchDashboardData(); alert("Confirmed! Transaction Complete."); };

    return (
        <div className="max-w-6xl mx-auto p-6 min-h-[80vh]">
            {reviewOrder && <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} onReviewSubmitted={fetchDashboardData} />}
            
            {/* Bank Modal */}
            {bankMode && <BankModal mode={bankMode} onClose={() => setBankMode(null)} onSuccess={fetchDashboardData} />}

            <h1 className="text-3xl font-black text-slate-900 mb-6">My Dashboard</h1>
            
            <div className="flex gap-6 mb-8 border-b border-slate-200">
                {['LISTINGS', 'ORDERS', 'WALLET'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} 
                        className={`pb-3 px-2 font-bold text-sm transition-all ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'LISTINGS' && (
                <div className="grid grid-cols-1 gap-4">
                    {myItems.length === 0 && <p className="text-slate-400 italic">No items listed yet.</p>}
                    {myItems.map(item => (
                        <ItemCard key={item.id} part={item} currentUser={user} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onAddToCart={()=>{}} />
                    ))}
                </div>
            )}

            {activeTab === 'ORDERS' && (
                <div className="space-y-4">
                    {orders.map(order => {
                        const isSeller = order.SellerId === user.id;
                        return (
                            <div key={order.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${isSeller ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>{isSeller ? 'Sale Request' : 'My Order'}</span>
                                        <span className="text-xs font-mono text-slate-400">#{order.id}</span>
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900">{order.Item?.title || 'Unknown Item'}</h3>
                                    <p className="text-sm text-slate-500">Total: <span className="font-bold text-slate-800">₹{order.total_amount.toLocaleString()}</span> • Status: <span className="font-medium text-blue-600">{order.status.replace('_', ' ')}</span></p>
                                </div>
                                
                                <div className="flex flex-col gap-2 w-full md:w-auto">
                                    {isSeller && order.status === 'PENDING_APPROVAL' && <button onClick={() => handleApprove(order.id)} className="bg-green-600 text-white px-4 py-2 rounded text-xs font-bold">Approve</button>}
                                    {!isSeller && order.status === 'APPROVED_PAY_PENDING' && <button onClick={() => handlePay(order.id)} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold flex gap-2"><Wallet size={14}/> Pay</button>}
                                    {order.status === 'IN_ESCROW' && <button onClick={() => handleConfirm(order.id)} className="bg-slate-900 text-white px-4 py-2 rounded text-xs font-bold flex gap-2 hover:bg-black"><PackageCheck size={14}/> {isSeller ? 'Confirm Handover' : 'Confirm Receipt'}</button>}
                                    
                                    {!isSeller && order.status === 'COMPLETED' && !order.is_reviewed && <button onClick={() => setReviewOrder(order)} className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded text-xs font-bold flex gap-2 hover:bg-yellow-500"><Star size={14} /> Rate Owner</button>}
                                    {order.status === 'COMPLETED' && order.is_reviewed && <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle size={14}/> Completed</span>}
                                </div>
                            </div>
                        );
                    })}
                    {orders.length === 0 && <p className="text-slate-400 italic">No orders found.</p>}
                </div>
            )}

            {/* WALLET SECTION */}
            {activeTab === 'WALLET' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Total Balance</p>
                            <h2 className="text-5xl font-black mb-8 tracking-tight">₹{(walletBalance || 0).toLocaleString('en-IN')}</h2>
                            
                            <div className="flex gap-3">
                                <button onClick={() => setBankMode('DEPOSIT')} 
                                    className="bg-green-500 hover:bg-green-400 text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
                                    <Plus size={18} /> Add Money
                                </button>
                                <button onClick={() => setBankMode('WITHDRAW')} 
                                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 backdrop-blur-sm transition-all">
                                    <ArrowUpRight size={18} /> Withdraw
                                </button>
                            </div>
                        </div>
                        <Wallet size={140} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                         <h3 className="font-bold text-lg mb-4 text-slate-800">Quick Actions</h3>
                         <p className="text-sm text-slate-500 leading-relaxed">
                             Use the <strong>Add Money</strong> button to deposit funds via our secure Dummy Gateway (OTP required).
                             <br/><br/>
                             Use <strong>Withdraw</strong> to transfer your earnings back to your registered bank account.
                         </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;