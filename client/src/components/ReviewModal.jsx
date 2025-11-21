import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import api from '../utils/api';

const ReviewModal = ({ order, onClose, onReviewSubmitted }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!comment) return alert("Please write a short review.");
        setSubmitting(true);
        try {
            await api.post('/reviews', {
                order_id: order.id,
                rating: rating,
                comment: comment
            });
            alert("Review Submitted! Thank you.");
            onReviewSubmitted();
            onClose();
        } catch (e) {
            alert("Failed to submit review.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl text-center relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"><X /></button>
                
                <h2 className="text-2xl font-black text-slate-900 mb-2">Rate your Experience</h2>
                <p className="text-slate-500 mb-6">How was your transaction with the owner?</p>

                {/* Star Rating */}
                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110 focus:outline-none">
                            <Star 
                                size={36} 
                                className={star <= rating ? "text-yellow-400 fill-current" : "text-slate-200 fill-current"} 
                            />
                        </button>
                    ))}
                </div>

                <textarea 
                    className="w-full p-4 border-2 border-slate-100 rounded-xl bg-slate-50 focus:border-blue-500 focus:bg-white transition-colors outline-none resize-none h-32"
                    placeholder="Write a few words about the equipment/service..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />

                <button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-6 hover:bg-blue-600 transition-colors shadow-lg"
                >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </div>
        </div>
    );
};

export default ReviewModal;