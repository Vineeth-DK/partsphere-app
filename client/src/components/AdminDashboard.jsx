import React, { useEffect, useState, useRef } from 'react';
import api, { getImageUrl } from '../utils/api';
import { Check, X, Wallet, ShieldCheck, User, LogOut, RefreshCw, Users, MessageSquare, Send } from 'lucide-react';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, VERIFIED, WALLET, SUPPORT
    const [pendingUsers, setPendingUsers] = useState([]);
    const [verifiedUsers, setVerifiedUsers] = useState([]);
    const [supportChats, setSupportChats] = useState([]);
    const [adminWallet, setAdminWallet] = useState(0);
    const [loading, setLoading] = useState(true);

    // Chat State
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [reply, setReply] = useState('');
    const scrollRef = useRef(null);

    // --- REAL-TIME POLLING ---
    useEffect(() => {
        fetchData();
        
        const interval = setInterval(() => {
            // Poll specifically for chats if on Support tab
            if (activeTab === 'SUPPORT') {
                fetchData(true);
                if (selectedChat) fetchMessages(selectedChat.id);
            } 
        }, 3000);

        return () => clearInterval(interval);
    }, [activeTab, selectedChat]);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            if (activeTab === 'PENDING') {
                const res = await api.get('/admin/pending');
                setPendingUsers(res.data);
            } else if (activeTab === 'VERIFIED') {
                const res = await api.get('/admin/verified');
                setVerifiedUsers(res.data);
            } else if (activeTab === 'WALLET') {
                const res = await api.get('/admin/wallet');
                setAdminWallet(res.data.balance);
            } else if (activeTab === 'SUPPORT') {
                // Re-using the standard chat endpoint since Admin is a participant (User ID 9999)
                const res = await api.get('/chats'); 
                setSupportChats(res.data);
            }
        } catch (e) { 
            console.error("Admin access denied"); 
        } finally { 
            if (!silent) setLoading(false); 
        }
    };

    const fetchMessages = async (chatId) => {
        const res = await api.get(`/chats/${chatId}/messages`);
        setMessages(res.data);
        if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
    };

    const handleReply = async () => {
        if (!reply.trim()) return;
        await api.post('/messages', { chat_id: selectedChat.id, content: reply });
        setReply('');
        fetchMessages(selectedChat.id);
    };

    const changeStatus = async (id, newStatus) => {
        if (window.confirm(`Mark user as ${newStatus}?`)) {
            await api.post(`/admin/user/${id}/status`, { status: newStatus });
            fetchData(); 
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-[#0f172a] font-sans text-slate-200 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#1e293b] border-r border-slate-700 flex flex-col fixed h-full">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-black text-blue-400 tracking-tight flex items-center gap-2">
                        <ShieldCheck /> ADMIN
                    </h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setActiveTab('PENDING')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'PENDING' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <User size={18} /> Pending Requests
                        {pendingUsers.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-auto">{pendingUsers.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('VERIFIED')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'VERIFIED' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Users size={18} /> Verified Accounts
                    </button>
                    <button onClick={() => setActiveTab('SUPPORT')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'SUPPORT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <MessageSquare size={18} /> Support Inbox
                    </button>
                    <button onClick={() => setActiveTab('WALLET')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'WALLET' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Wallet size={18} /> Commission Wallet
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-700">
                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 font-bold text-sm w-full hover:bg-slate-800 p-2 rounded">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* Content */}
            <main className="flex-1 p-8 ml-64 overflow-y-auto h-screen">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white">
                        {activeTab === 'PENDING' && 'Verification Queue'}
                        {activeTab === 'VERIFIED' && 'Verified User Database'}
                        {activeTab === 'SUPPORT' && 'Customer Support'}
                        {activeTab === 'WALLET' && 'Platform Financials'}
                    </h2>
                    <button onClick={() => fetchData(false)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400"><RefreshCw size={16}/></button>
                </div>

                {/* USER LISTS (PENDING / VERIFIED) */}
                {(activeTab === 'PENDING' || activeTab === 'VERIFIED') && (
                    <div className="grid grid-cols-1 gap-4">
                        {(activeTab === 'PENDING' ? pendingUsers : verifiedUsers).length === 0 && (
                            <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-800">
                                <p className="text-slate-500">No users found in this category.</p>
                            </div>
                        )}
                        
                        {(activeTab === 'PENDING' ? pendingUsers : verifiedUsers).map(u => (
                            <div key={u.id} className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row gap-6 items-start animate-fade-in">
                                <div className="flex gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-slate-500">Selfie</p>
                                        <a href={getImageUrl(u.selfie_url)} target="_blank" rel="noreferrer">
                                            <img src={getImageUrl(u.selfie_url)} className="w-20 h-20 rounded-lg object-cover bg-black border border-slate-600 hover:opacity-80 transition-opacity" alt="Selfie"/>
                                        </a>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-slate-500">ID Proof</p>
                                        <a href={getImageUrl(u.id_proof_url)} target="_blank" rel="noreferrer">
                                            <img src={getImageUrl(u.id_proof_url)} className="w-32 h-20 rounded-lg object-cover bg-black border border-slate-600 hover:opacity-80 transition-opacity" alt="ID"/>
                                        </a>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white">{u.name}</h3>
                                    <p className="text-slate-400 text-sm font-mono">{u.email}</p>
                                    <p className="text-slate-400 text-sm mt-1">Mobile: <span className="text-white">{u.mobile_number}</span></p>
                                    <div className={`mt-2 inline-block px-2 py-1 text-xs font-bold rounded ${u.verification_status === 'APPROVED' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-500'}`}>
                                        {u.verification_status}
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4 md:mt-0">
                                    {activeTab === 'PENDING' ? (
                                        <>
                                            <button onClick={() => changeStatus(u.id, 'APPROVED')} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg"><Check size={16}/> Approve</button>
                                            <button onClick={() => changeStatus(u.id, 'REJECTED')} className="bg-red-900/50 hover:bg-red-900 text-red-400 px-4 py-2 rounded-lg font-bold text-sm border border-red-800">Reject</button>
                                        </>
                                    ) : (
                                        <button onClick={() => changeStatus(u.id, 'PENDING')} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg font-bold text-sm border border-slate-600">Revoke</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* SUPPORT CHAT TAB */}
                {activeTab === 'SUPPORT' && (
                    <div className="flex gap-4 h-[70vh]">
                        {/* User List */}
                        <div className="w-1/3 bg-[#1e293b] rounded-xl border border-slate-700 overflow-y-auto">
                            {supportChats.map(chat => {
                                // Determine who the "Other" user is (Not the Admin)
                                const otherUser = chat.User1Id === 9999 ? chat.User2 : chat.User1;
                                return (
                                    <div key={chat.id} onClick={() => { setSelectedChat(chat); fetchMessages(chat.id); }} 
                                        className={`p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-700 ${selectedChat?.id === chat.id ? 'bg-blue-900/30' : ''}`}>
                                        <h4 className="font-bold text-white">{otherUser?.name || 'User'}</h4>
                                        <p className="text-xs text-slate-400 truncate">{chat.last_message}</p>
                                    </div>
                                );
                            })}
                            {supportChats.length === 0 && <div className="p-6 text-center text-slate-500">No active support tickets.</div>}
                        </div>

                        {/* Chat Window */}
                        <div className="flex-1 bg-[#1e293b] rounded-xl border border-slate-700 flex flex-col">
                            {selectedChat ? (
                                <>
                                    <div className="p-4 border-b border-slate-700 font-bold text-white flex items-center gap-2">
                                        <User size={18}/> Chatting with {selectedChat.User1Id === 9999 ? selectedChat.User2?.name : selectedChat.User1?.name}
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {messages.map(m => (
                                            <div key={m.id} className={`flex ${m.SenderId === 9999 ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`p-3 rounded-xl text-sm max-w-[70%] ${m.SenderId === 9999 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                                    {m.content}
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={scrollRef} />
                                    </div>
                                    <div className="p-4 border-t border-slate-700 flex gap-2">
                                        <input className="flex-1 bg-slate-800 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500" 
                                            value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReply()} placeholder="Type a reply..." />
                                        <button onClick={handleReply} className="bg-blue-600 p-3 rounded-lg hover:bg-blue-500 text-white"><Send size={20}/></button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                                    <MessageSquare size={48} className="opacity-20"/>
                                    <p>Select a user to reply</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* WALLET TAB */}
                {activeTab === 'WALLET' && (
                    <div className="max-w-md">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-2xl">
                            <p className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-1">Total Commission Earnings</p>
                            <h2 className="text-5xl font-black text-white">₹{adminWallet.toLocaleString('en-IN')}</h2>
                            <p className="text-xs text-blue-100 mt-4 bg-white/10 inline-block px-3 py-1 rounded-full">2% Fee collected from all transactions</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;