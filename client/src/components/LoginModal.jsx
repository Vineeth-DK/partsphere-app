import React, { useState } from 'react';
import { X, User, Lock, Mail } from 'lucide-react';
import api from '../utils/api';

const LoginModal = ({ onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    
    const payload = isLogin 
        ? { username: formData.name, password: formData.password } 
        : formData;
    
    try {
      const res = await api.post(endpoint, payload);
      if (res.data.token) localStorage.setItem('token', res.data.token);
      if (res.data.user) {
          localStorage.setItem('user_data', JSON.stringify(res.data.user));
          onLogin(res.data.user);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X /></button>
        
        <div className="bg-blue-600 p-6 text-center text-white">
            <h2 className="text-2xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-blue-100 text-sm">PartSphere Professional</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded text-center">{error}</div>}

            <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Username" className="w-full pl-10 p-3 border rounded-lg outline-none focus:border-blue-600" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>

            {!isLogin && (
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input type="email" placeholder="Email Address" className="w-full pl-10 p-3 border rounded-lg outline-none focus:border-blue-600" 
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
            )}

            <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input type="password" placeholder="Password" className="w-full pl-10 p-3 border rounded-lg outline-none focus:border-blue-600" 
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all">
                {isLogin ? 'Log In' : 'Sign Up'}
            </button>

            <div className="text-center text-sm pt-2">
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-bold hover:underline">
                    {isLogin ? 'New here? Create Account' : 'Have an account? Log In'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;