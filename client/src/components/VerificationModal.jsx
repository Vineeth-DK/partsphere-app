import React, { useState } from 'react';
import { X, Upload, ShieldCheck, CheckCircle, Smartphone, User, FileText } from 'lucide-react';
import api from '../utils/api';

const VerificationModal = ({ onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [files, setFiles] = useState({ selfie: null, id_proof: null });
    const [previews, setPreviews] = useState({ selfie: null, id_proof: null });
    const [loading, setLoading] = useState(false);

    // --- STEP 1: SEND OTP ---
    const handleSendOtp = async () => {
        if (mobile.length !== 10) return alert("Invalid Mobile Number");
        setLoading(true);
        try {
            // Simulates sending OTP (Check backend console)
            await api.post('/otp/send', { mobile });
            alert("OTP Sent! (Check Server Console)");
            setLoading(false);
            setStep(2);
        } catch (e) { 
            alert("Failed to send OTP"); 
            setLoading(false); 
        }
    };

    // --- STEP 2: VERIFY OTP ---
    const handleVerifyOtp = async () => {
        try {
            await api.post('/otp/verify', { mobile, otp });
            setStep(3); // Move to Documents
        } catch (e) { 
            alert("Invalid OTP"); 
        }
    };

    // --- STEP 3: UPLOAD DOCUMENTS ---
    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [type]: file }));
            setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
        }
    };

    const handleUpload = async () => {
        if (!files.selfie || !files.id_proof) return alert("Please upload both Selfie and Government ID");
        setLoading(true);
        
        const formData = new FormData();
        formData.append('mobile', mobile);
        formData.append('selfie', files.selfie);
        formData.append('id_proof', files.id_proof);
        
        try {
            await api.post('/verify/submit', formData);
            setLoading(false);
            setStep(4); // Success
        } catch (e) {
            alert("Upload failed. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-900">User Verification</h2>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-slate-800"/></button>
                </div>

                {/* Steps Indicator */}
                <div className="flex border-b">
                    {['Mobile OTP', 'Documents', 'Review'].map((label, i) => (
                        <div key={i} className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider 
                            ${(step === 1 || step === 2) && i === 0 ? 'text-blue-600 border-b-2 border-blue-600' : 
                              step === 3 && i === 1 ? 'text-blue-600 border-b-2 border-blue-600' :
                              step === 4 && i === 2 ? 'text-green-600 border-b-2 border-green-600' : 'text-slate-300'}`}>
                            {label}
                        </div>
                    ))}
                </div>

                <div className="p-8">
                    
                    {/* STEP 1: MOBILE INPUT */}
                    {step === 1 && (
                        <div className="space-y-6 text-center animate-fade-in">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                                <Smartphone size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Verify Mobile Number</h3>
                                <p className="text-sm text-slate-500">We will send a One Time Password to your number.</p>
                            </div>
                            <input placeholder="Enter 10-digit Number" className="w-full p-4 border-2 border-slate-200 rounded-xl text-center text-xl font-bold tracking-widest focus:border-blue-500 outline-none" 
                                value={mobile} onChange={e => setMobile(e.target.value)} maxLength={10} autoFocus />
                            <button onClick={handleSendOtp} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all">
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </div>
                    )}

                    {/* STEP 2: OTP INPUT */}
                    {step === 2 && (
                        <div className="space-y-6 text-center animate-fade-in">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Enter OTP</h3>
                                <p className="text-sm text-slate-500">Sent to +91 {mobile}</p>
                            </div>
                            <input placeholder="XXXXXX" className="w-full p-4 border-2 border-slate-200 rounded-xl text-center text-3xl font-black tracking-[0.5em] focus:border-blue-500 outline-none" 
                                value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} autoFocus />
                            <button onClick={handleVerifyOtp} className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold transition-all">
                                Verify Code
                            </button>
                            <button onClick={() => setStep(1)} className="text-sm text-slate-400 underline">Change Number</button>
                        </div>
                    )}

                    {/* STEP 3: DOCUMENT UPLOAD */}
                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800">Identity Proof</h3>
                                <p className="text-sm text-slate-500">Upload clear photos to verify your identity.</p>
                            </div>

                            {/* Selfie Upload */}
                            <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl bg-slate-50">
                                <div className="w-16 h-16 bg-white rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative">
                                    {previews.selfie ? <img src={previews.selfie} className="w-full h-full object-cover" /> : <User className="text-slate-300"/>}
                                    <input type="file" onChange={(e) => handleFileChange(e, 'selfie')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-slate-700">Your Picture (Selfie)</h4>
                                    <p className="text-xs text-slate-400">Click box to upload</p>
                                </div>
                                {files.selfie && <CheckCircle size={20} className="text-green-500" />}
                            </div>

                            {/* ID Proof Upload */}
                            <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl bg-slate-50">
                                <div className="w-16 h-16 bg-white rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative">
                                    {previews.id_proof ? <img src={previews.id_proof} className="w-full h-full object-cover" /> : <FileText className="text-slate-300"/>}
                                    <input type="file" onChange={(e) => handleFileChange(e, 'id_proof')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-slate-700">Govt. ID Proof</h4>
                                    <p className="text-xs text-slate-400">Aadhar / PAN / Driving License</p>
                                </div>
                                {files.id_proof && <CheckCircle size={20} className="text-green-500" />}
                            </div>

                            <button onClick={handleUpload} disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-bold transition-all">
                                {loading ? 'Uploading Securely...' : 'Submit Verification'}
                            </button>
                        </div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === 4 && (
                        <div className="text-center py-8 animate-fade-in">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Verification Submitted!</h2>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                Your profile is now <strong>Pending Approval</strong>. You will be able to list and rent items once our Admin team verifies your documents.
                            </p>
                            <button onClick={() => { onClose(); onComplete(); }} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200">
                                Return to Dashboard
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default VerificationModal;