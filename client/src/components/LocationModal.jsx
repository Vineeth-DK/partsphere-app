import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';

const LocationModal = ({ onSetLocation, onClose, force }) => {
  const [input, setInput] = useState('');
  const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) onSetLocation(input);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" /> 
      
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl relative z-10 animate-fade-in">
        {!force && (
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black">
                <X />
            </button>
        )}

        <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Select Jobsite Location</h2>
            <p className="text-gray-500">We need your location to show available inventory.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="relative mb-6">
            <MapPin className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Enter City or Zip Code"
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none text-lg font-medium transition-colors"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
          </div>

          <div className="mb-8">
            <p className="text-xs text-gray-400 uppercase font-bold mb-3 tracking-wider text-center">Major Cities</p>
            <div className="flex flex-wrap gap-2 justify-center">
                {cities.map(city => (
                    <button 
                        type="button"
                        key={city}
                        onClick={() => onSetLocation(city)}
                        className="px-4 py-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-gray-200 rounded-full text-sm font-medium transition-all"
                    >
                        {city}
                    </button>
                ))}
            </div>
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all text-lg shadow-lg hover:shadow-blue-600/30">
            Confirm Location
          </button>
        </form>
      </div>
    </div>
  );
};

export default LocationModal;