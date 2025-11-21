import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Send, Headphones, X, Loader2 } from 'lucide-react';

const ChatSystem = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    // Initialize Support Chat on Open
    useEffect(() => {
        if (isOpen) {
            initializeSupport();
        }
    }, [isOpen]);

    const initializeSupport = async () => {
        setLoading(true);
        try {
            // Create/Get chat with Admin (ID 9999)
            const res = await api.post('/support/chat');
            setChatId(res.data.id);
            fetchMessages(res.data.id);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // Poll for new replies
    useEffect(() => {
        if (isOpen && chatId) {
            const interval = setInterval(() => fetchMessages(chatId), 3000);
            return () => clearInterval(interval);
        }
    }, [isOpen, chatId]);

    const fetchMessages = async (id) => {
        const res = await api.get(`/chats/${id}/messages`);
        setMessages(res.data);
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        await api.post('/messages', { chat_id: chatId, content: input });
        setInput('');
        fetchMessages(chatId);
    };

    // Auto-scroll
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Don't show support chat for Admin user
    if (user.name === 'Admin' || user.is_admin) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            <button onClick={() => setIsOpen(!isOpen)} 
                className="bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all flex items-center gap-2">
                {isOpen ? <X size={24} /> : <><Headphones size={24} /><span className="font-bold hidden sm:inline">Support</span></>}
            </button>

            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 h-[450px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-fade-in">
                    
                    <div className="bg-slate-900 p-4 flex items-center gap-3">
                        <div className="bg-green-500 p-2 rounded-full"><Headphones size={16} className="text-white"/></div>
                        <div>
                            <h3 className="text-white font-bold text-sm">Customer Support</h3>
                            <p className="text-slate-400 text-xs">Ask us anything!</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                        {loading ? (
                            <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-blue-600"/></div>
                        ) : (
                            <div className="space-y-3">
                                {/* Welcome Message */}
                                <div className="flex justify-start">
                                    <div className="max-w-[85%] p-3 rounded-xl text-xs bg-white border text-slate-800 shadow-sm">
                                        Hello! How can we help you with your equipment today?
                                    </div>
                                </div>

                                {messages.map(m => (
                                    <div key={m.id} className={`flex ${m.SenderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-2.5 rounded-xl text-xs ${m.SenderId === user.id ? 'bg-blue-600 text-white' : 'bg-white border text-slate-800 shadow-sm'}`}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                <div ref={scrollRef} />
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-white border-t flex gap-2">
                        <input className="flex-1 border p-2 rounded-lg outline-none text-xs bg-slate-50 focus:bg-white transition-colors" 
                            value={input} onChange={e => setInput(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Type your query..." />
                        <button onClick={handleSend} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Send size={14}/></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatSystem;