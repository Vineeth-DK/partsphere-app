import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ChevronRight, ChevronLeft, CreditCard, MapPin, ShieldCheck, MessageCircle } from 'lucide-react';
import api from '../utils/api';

const RentalWizard = ({ item, onClose, user, onChat }) => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const isSale = item.listing_type === 'SELL';
  const [blockedDates, setBlockedDates] = useState([]);
  
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    duration: 1,
    buyerName: user?.name || '',
    buyerMobile: '',
    buyerEmail: user?.email || '',
    projectDesc: '',
    entityType: 'Individual',
    orgName: '',
    gst: '',
    workLocation: '',
    contactName: '',
    contactPhone: ''
  });

  useEffect(() => {
      if (!isSale) {
          api.get(`/items/${item.id}/bookings`).then(res => setBlockedDates(res.data));
      }
  }, []);

  const basePrice = isSale ? item.price_day : (item.price_day * formData.duration);
  const platformFee = Math.round(basePrice * 0.02); 
  const totalCost = basePrice + platformFee;

  const handleNext = () => {
      if (step === 1 && !isSale) {
          const start = new Date(formData.startDate);
          for (let i=0; i < formData.duration; i++) {
              const d = new Date(start); d.setDate(start.getDate() + i);
              const iso = d.toISOString().split('T')[0];
              if (blockedDates.includes(iso)) {
                  alert(`Date ${iso} is blocked!`); return;
              }
          }
      }
      setStep(step + 1);
  };
  
  const handleBack = () => setStep(step - 1);

  const handleSubmitRequest = async () => {
      try {
          await api.post('/orders/request', {
              item_id: item.id, user_id: user.id,
              start_date: isSale ? null : formData.startDate,
              duration: isSale ? 0 : formData.duration,
              total_cost: totalCost,
              buyer_details: { name: formData.buyerName, email: formData.buyerEmail, phone: formData.buyerMobile },
              project_details: {
                  description: isSale ? 'Purchase' : formData.projectDesc,
                  entity: formData.entityType,
                  org_name: formData.orgName, gst: formData.gst,
                  location: formData.workLocation,
                  site_contact: { name: formData.contactName, phone: formData.contactPhone }
              }
          });
          setStep(5);
      } catch(e) { alert("Error submitting."); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-white p-6 border-b flex justify-between">
            <h2 className="text-xl font-black">{isSale ? 'Buy' : 'Rent'} {item.title}</h2>
            <button onClick={onClose}><X /></button>
        </div>
        <div className="p-8 overflow-y-auto flex-1">
            {/* STEP 1: SCHEDULE (RENT) */}
            {!isSale && step === 1 && (
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold">Select Dates</h3>
                    <input type="date" className="w-full p-4 border rounded-xl" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}/>
                    <input type="number" className="w-full p-4 border rounded-xl" placeholder="Days" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})}/>
                    <div className="flex gap-1 flex-wrap mt-4">
                        {blockedDates.slice(0, 10).map(d => <span key={d} className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">{d}</span>)}
                    </div>
                </div>
            )}

            {/* STEP 2 (Rent) / STEP 1 (Buy): CONTACT */}
            {((!isSale && step === 2) || (isSale && step === 1)) && (
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold">Contact Details</h3>
                    <input placeholder="Name" className="w-full p-4 border rounded-xl" value={formData.buyerName} onChange={e => setFormData({...formData, buyerName: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Mobile" className="p-4 border rounded-xl" value={formData.buyerMobile} onChange={e => setFormData({...formData, buyerMobile: e.target.value})} />
                        <input placeholder="Email" className="p-4 border rounded-xl" value={formData.buyerEmail} onChange={e => setFormData({...formData, buyerEmail: e.target.value})} />
                    </div>
                </div>
            )}

            {/* STEP 3 (Rent) / STEP 2 (Buy): DETAILS */}
            {((!isSale && step === 3) || (isSale && step === 2)) && (
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold">Details</h3>
                    <div className="flex gap-4 mb-4">
                        <button onClick={()=>setFormData({...formData, entityType:'Individual'})} className={`px-4 py-2 rounded border ${formData.entityType==='Individual'?'bg-blue-50 border-blue-500':''}`}>Individual</button>
                        <button onClick={()=>setFormData({...formData, entityType:'Organization'})} className={`px-4 py-2 rounded border ${formData.entityType==='Organization'?'bg-blue-50 border-blue-500':''}`}>Organization</button>
                    </div>
                    {formData.entityType === 'Organization' && (
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Org Name" className="p-4 border rounded-xl" value={formData.orgName} onChange={e => setFormData({...formData, orgName: e.target.value})} />
                            <input placeholder="GST" className="p-4 border rounded-xl" value={formData.gst} onChange={e => setFormData({...formData, gst: e.target.value})} />
                        </div>
                    )}
                    <input placeholder="Address / Location" className="w-full p-4 border rounded-xl" value={formData.workLocation} onChange={e => setFormData({...formData, workLocation: e.target.value})} />
                    {!isSale && (
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Contact Name" className="p-4 border rounded-xl" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} />
                            <input placeholder="Contact Phone" className="p-4 border rounded-xl" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} />
                        </div>
                    )}
                </div>
            )}

            {/* SUMMARY */}
            {((!isSale && step === 4) || (isSale && step === 3)) && (
                <div className="space-y-6 text-center">
                    <h3 className="text-3xl font-black">Summary</h3>
                    <div className="bg-slate-50 p-6 rounded-xl text-left">
                        <div className="flex justify-between"><span>Base</span><span>₹{basePrice}</span></div>
                        <div className="flex justify-between"><span>Fee (2%)</span><span>₹{platformFee}</span></div>
                        <div className="border-t pt-2 mt-2 font-bold flex justify-between text-xl"><span>Total</span><span>₹{totalCost}</span></div>
                    </div>
                </div>
            )}

            {/* SUCCESS */}
            {step === 5 && (
                 <div className="text-center py-10">
                    <CheckCircle size={60} className="text-green-500 mx-auto" />
                    <h2 className="text-2xl font-bold mt-4">Request Sent!</h2>
                    <button onClick={onClose} className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-xl">Close</button>
                </div>
            )}
        </div>

        <div className="p-6 border-t flex justify-between">
            {step > 1 && step < 5 && <button onClick={handleBack} className="font-bold text-slate-500">Back</button>}
            {step < 5 && (
                <button onClick={((!isSale && step === 4) || (isSale && step === 3)) ? handleSubmitRequest : handleNext} 
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold ml-auto">
                    {((!isSale && step === 4) || (isSale && step === 3)) ? 'Confirm' : 'Continue'}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default RentalWizard;