
import React, { useState, useEffect } from 'react';
import type { View } from '../App';
import type { LessonPlan } from '../types';

interface WelcomeScreenProps {
    onNavigate: (view: View, lesson?: LessonPlan) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
    const [savedPlans, setSavedPlans] = useState<LessonPlan[]>([]);

    useEffect(() => {
        try {
            const plansJson = localStorage.getItem('savedLessonPlans');
            if (plansJson) {
                setSavedPlans(JSON.parse(plansJson));
            }
        } catch (error) {
            console.error("Failed to load saved lesson plans:", error);
        }
    }, []);

    const deletePlan = (e: React.MouseEvent, planId: string) => {
        e.stopPropagation(); // Prevent opening the plan when deleting
        if (window.confirm('هل أنت متأكد من حذف هذه الخطة؟')) {
            const updatedPlans = savedPlans.filter(p => p.id !== planId);
            localStorage.setItem('savedLessonPlans', JSON.stringify(updatedPlans));
            setSavedPlans(updatedPlans);
        }
    };


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 to-indigo-200 p-8 text-center">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-10 max-w-4xl w-full">
                <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-800 mb-4">
                    التحضير المساعد للمعلم بالذكاء الاصطناعي
                </h1>
                <div className="mt-6 text-slate-700">
                    <p className="text-lg font-semibold">إعداد المستشار الإداري والتربوي:</p>
                    <p className="text-xl font-bold text-indigo-700">إبراهيم بن صالح بن حسن دُخَّان</p>
                    <p className="mt-2 text-md">للتواصل عبر رقم الهاتف: <span dir="ltr">780804012</span></p>
                </div>
                 <div className="mt-12">
                     <button 
                        onClick={() => onNavigate('planner')}
                        className="bg-indigo-600 text-white font-bold py-4 px-10 rounded-lg shadow-lg hover:bg-indigo-700 transform hover:-translate-y-1 transition-all duration-300 ease-in-out flex items-center justify-center space-x-2 space-x-reverse w-full md:w-auto md:mx-auto"
                    >
                       <span>إنشاء درس جديد</span>
                    </button>
                </div>

                {savedPlans.length > 0 && (
                    <div className="mt-10 text-right">
                        <h2 className="text-2xl font-bold text-slate-700 mb-4 text-center">الدروس المحفوظة</h2>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border-t pt-4">
                            {savedPlans.map(plan => (
                                <div key={plan.id} onClick={() => onNavigate('planner', plan)} className="flex justify-between items-center bg-white/50 p-3 rounded-lg shadow hover:shadow-md hover:bg-white transition-all cursor-pointer">
                                    <div className="flex flex-col text-right">
                                        <span className="font-semibold text-indigo-800">{plan.lessonTitle || 'درس بدون عنوان'}</span>
                                        <span className="text-sm text-slate-600">{plan.subject} - {plan.date}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => deletePlan(e, plan.id)} className="bg-red-500 text-white text-sm py-1 px-3 rounded hover:bg-red-600 transition-colors">حذف</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
             <footer className="absolute bottom-4 text-center text-slate-600 text-sm">
                <p>جميع الحقوق محفوظة لدى المستشار إبراهيم بن صالح دخان &copy; {new Date().getFullYear()}</p>
                <a 
                    href="https://wa.me/967780804012" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 inline-block bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                    تواصل معنا عبر واتساب
                </a>
            </footer>
        </div>
    );
};

export default WelcomeScreen;
