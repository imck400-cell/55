import React, { useState, useEffect, useRef } from 'react';
import { analyzeLessonPlanWithGemini } from '../services/geminiService';
import type { LessonPlan, Objective } from '../types';
import { BloomLevelCognitive, BloomLevelAffective, BloomLevelPsychomotor } from '../types';
import { SUBJECTS, GRADES, SECTIONS, PERIODS, DAYS, INTRO_TYPES, TEACHING_METHODS, TEACHING_AIDS } from '../constants';

// @ts-ignore
const { jsPDF } = window.jspdf;
declare const html2canvas: any;

interface LessonPlannerProps {
    onBackToWelcome: () => void;
    lesson: LessonPlan | null;
}

const initialLessonPlan: LessonPlan = {
  id: `plan-${Date.now()}`,
  emblem1: null,
  emblem2: null,
  yemenRepublic: 'الجمهورية اليمنية',
  ministry: 'وزارة التربية والتعليم',
  educationArea: '',
  schoolName: '',
  day: '',
  date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
  subject: '',
  lessonTitle: '',
  grade: '',
  section: '',
  period: '',
  behavior: 'سلوك متوقع إيجابي',
  teachingMethods: [],
  teachingAids: [],
  lessonIntro: '',
  introType: '',
  activities: '',
  cognitiveObjectives: [],
  psychomotorObjectives: [],
  affectiveObjectives: [],
  teacherRole: 'موجه ومرشد',
  studentRole: 'مشارك ومتفاعل',
  lessonContent: '',
  lessonClosure: '',
  closureType: '',
  homework: '',
  homeworkType: 'واجب منزلي',
  adminNotes: '',
  praise: 'ثناء وتشجيع',
  teacherName: '',
};

const ImageUploader: React.FC<{
    image: string | null;
    onImageChange: (base64: string | null) => void;
    isPrinting: boolean;
}> = ({ image, onImageChange, isPrinting }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onImageChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerUpload = () => inputRef.current?.click();

    return (
        <div className={`w-20 h-20 border-2 border-dashed rounded-full flex items-center justify-center ${isPrinting ? 'border-slate-400' : 'cursor-pointer hover:border-indigo-500 bg-slate-50'}`} onClick={!isPrinting ? triggerUpload : undefined}>
            <input type="file" accept="image/*" ref={inputRef} onChange={handleImageUpload} className="hidden" />
            {image ? (
                <img src={image} alt="شعار" className="w-full h-full object-cover rounded-full" />
            ) : (
                <div className="text-center text-slate-400 text-xs px-1">{isPrinting ? '' : 'تغيير الشعار'}</div>
            )}
        </div>
    );
};


const LessonPlanner: React.FC<LessonPlannerProps> = ({ onBackToWelcome, lesson }) => {
    const [lessonPlan, setLessonPlan] = useState<LessonPlan>(initialLessonPlan);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    const titleStyle = { textShadow: '1px 1px 1px rgba(0,0,0,0.1)' };
    const mainTitleStyle = { textShadow: '2px 2px 3px rgba(0,0,0,0.2)', fontFamily: "'Changa', sans-serif", fontWeight: 700 };


    useEffect(() => {
        if (lesson) {
            setLessonPlan(lesson);
        } else {
            try {
                const profileJson = localStorage.getItem('teacherProfile');
                const profile = profileJson ? JSON.parse(profileJson) : {};
                setLessonPlan({
                    ...initialLessonPlan,
                    ...profile,
                    id: `plan-${Date.now()}`,
                });
            } catch (error) {
                console.error("Failed to load teacher profile:", error);
                setLessonPlan({ ...initialLessonPlan, id: `plan-${Date.now()}` });
            }
        }
    }, [lesson]);
    
    const handleSave = () => {
        try {
            const plansJson = localStorage.getItem('savedLessonPlans');
            let plans: LessonPlan[] = plansJson ? JSON.parse(plansJson) : [];
            const existingPlanIndex = plans.findIndex(p => p.id === lessonPlan.id);

            if (existingPlanIndex > -1) {
                plans[existingPlanIndex] = lessonPlan;
            } else {
                plans.push(lessonPlan);
            }
            localStorage.setItem('savedLessonPlans', JSON.stringify(plans));

            // Also update the teacher profile with the latest info
            const { educationArea, schoolName, emblem1, emblem2, teacherName } = lessonPlan;
            const profile = { educationArea, schoolName, emblem1, emblem2, teacherName };
            localStorage.setItem('teacherProfile', JSON.stringify(profile));
            
            alert('تم حفظ الخطة بنجاح!');
        } catch (err) {
            console.error("Failed to save lesson plan:", err);
            alert('حدث خطأ أثناء حفظ الخطة.');
        }
    };

    const handleExportPdf = async () => {
        setIsExporting(true);
        setIsPrinting(true);
    
        setTimeout(async () => {
            const printableArea = document.getElementById('printable-area');
            if (!printableArea) {
                setIsPrinting(false);
                setIsExporting(false);
                return;
            }
    
            try {
                const canvas = await html2canvas(printableArea, { scale: 2.5, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
                const A4_WIDTH_MM = 210;
                const A4_HEIGHT_MM = 297;
                const MARGIN_MM = 5;

                const usableWidth = A4_WIDTH_MM - MARGIN_MM * 2;
                const ratio = canvas.height / canvas.width;
                const scaledHeight = usableWidth * ratio;
                let heightLeft = scaledHeight;
                let position = MARGIN_MM;
    
                pdf.addImage(imgData, 'PNG', MARGIN_MM, position, usableWidth, scaledHeight);
                heightLeft -= (A4_HEIGHT_MM - MARGIN_MM * 2);
    
                while (heightLeft > 0) {
                    position = -A4_HEIGHT_MM * (Math.floor(scaledHeight / A4_HEIGHT_MM)) + MARGIN_MM;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', MARGIN_MM, position, usableWidth, scaledHeight);
                    heightLeft -= A4_HEIGHT_MM;
                }
                
                pdf.save(`${lessonPlan.lessonTitle || 'خطة-درس'}.pdf`);
    
            } catch (err) {
                setError("حدث خطأ أثناء إنشاء ملف PDF.");
            } finally {
                setIsPrinting(false);
                setIsExporting(false);
            }
        }, 100);
    };

    const handleAnalyze = async () => {
        if (!inputText.trim()) {
            setError("الرجاء إدخال نص خطة الدرس للتحليل.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const partialPlan = await analyzeLessonPlanWithGemini(inputText);
            setLessonPlan(prev => ({
                ...prev,
                ...partialPlan,
                 // Ensure arrays are properly merged and don't become undefined
                cognitiveObjectives: partialPlan.cognitiveObjectives || prev.cognitiveObjectives,
                psychomotorObjectives: partialPlan.psychomotorObjectives || prev.psychomotorObjectives,
                affectiveObjectives: partialPlan.affectiveObjectives || prev.affectiveObjectives,
                teachingMethods: partialPlan.teachingMethods && partialPlan.teachingMethods.length > 0 ? partialPlan.teachingMethods : prev.teachingMethods,
                teachingAids: partialPlan.teachingAids && partialPlan.teachingAids.length > 0 ? partialPlan.teachingAids : prev.teachingAids,
            }));
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("فشل تحليل خطة الدرس. الرجاء المحاولة مرة أخرى.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'date') {
            try {
                // Create a date object ensuring it's interpreted as local time to avoid timezone shifts
                const dateObj = new Date(value + 'T00:00:00'); 
                const dayIndex = dateObj.getUTCDay(); // 0 for Sunday, 1 for Monday...
                const dayName = DAYS[dayIndex];
                setLessonPlan(prev => ({ ...prev, date: value, day: dayName }));
            } catch (error) {
                 // Fallback for invalid dates
                setLessonPlan(prev => ({ ...prev, date: value }));
            }
        } else {
            setLessonPlan(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCheckboxChange = (field: 'teachingMethods' | 'teachingAids', value: string) => {
        setLessonPlan(prev => {
            const currentValues = prev[field] as string[];
            const newValues = currentValues.includes(value) ? currentValues.filter(item => item !== value) : [...currentValues, value];
            return { ...prev, [field]: newValues };
        });
    };
    
    const setEmblem = (emblemNumber: 1 | 2, base64: string | null) => {
        setLessonPlan(prev => ({...prev, [`emblem${emblemNumber}`]: base64 }));
    };

    const updateObjective = (type: 'cognitive' | 'psychomotor' | 'affective', index: number, field: keyof Omit<Objective, 'id'>, value: string) => {
        const key = `${type}Objectives` as const;
        const updatedObjectives = [...lessonPlan[key]];
        updatedObjectives[index] = { ...updatedObjectives[index], [field]: value };
        setLessonPlan(prev => ({ ...prev, [key]: updatedObjectives }));
    };

    const addObjective = (type: 'cognitive' | 'psychomotor' | 'affective') => {
        const key = `${type}Objectives` as const;
        const newObjective: Objective = { id: `new-${type}-${Date.now()}`, level: '', formulation: '', evaluation: '' };
        setLessonPlan(prev => ({ ...prev, [key]: [...prev[key], newObjective] }));
    };

    const removeObjective = (type: 'cognitive' | 'psychomotor' | 'affective', id: string) => {
        const key = `${type}Objectives` as const;
        setLessonPlan(prev => ({ ...prev, [key]: prev[key].filter(obj => obj.id !== id) }));
    };

    const renderObjectiveRows = (type: 'cognitive' | 'psychomotor' | 'affective', objectives: Objective[], levelEnum: any) => (
        <div className="space-y-1">
            {objectives.map((obj, index) => (
                <div key={obj.id} className="grid grid-cols-1 md:grid-cols-12 gap-1 items-start">
                    {isPrinting ? (<>
                        <p className="md:col-span-3 p-1 text-xs border rounded-md bg-slate-50 font-bold">{obj.level || '-'}</p>
                        <p className="md:col-span-5 p-1 text-xs border rounded-md bg-slate-50 font-bold">{obj.formulation || '-'}</p>
                        <p className="md:col-span-4 p-1 text-xs border rounded-md bg-slate-50 font-bold">{obj.evaluation || '-'}</p>
                    </>) : (<>
                        <select value={obj.level} onChange={(e) => updateObjective(type, index, 'level', e.target.value)} className="md:col-span-3 p-1 border rounded-md bg-white text-sm font-bold"><option value="">اختر المستوى</option>{Object.values(levelEnum).map((level: any) => <option key={level} value={level}>{level}</option>)}</select>
                        <textarea value={obj.formulation} onChange={(e) => updateObjective(type, index, 'formulation', e.target.value)} placeholder="صياغة الهدف" className="md:col-span-5 p-1 border rounded-md text-sm font-bold" rows={1} />
                        <textarea value={obj.evaluation} onChange={(e) => updateObjective(type, index, 'evaluation', e.target.value)} placeholder="أسلوب التقييم" className="md:col-span-3 p-1 border rounded-md text-sm font-bold" rows={1} />
                        <button type="button" onClick={() => removeObjective(type, obj.id)} className="md:col-span-1 bg-red-500 text-white p-1 rounded-md hover:bg-red-600 h-full text-sm">حذف</button>
                    </>)}
                </div>
            ))}
            {!isPrinting && <button type="button" onClick={() => addObjective(type)} className="mt-1 bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600 text-sm">إضافة هدف</button>}
        </div>
    );
    
    const renderStaticTextarea = (value: string | undefined, small: boolean = false) => <div className={`w-full p-1.5 border rounded-md bg-slate-50 whitespace-pre-wrap font-bold ${small ? 'text-xs' : 'text-sm'}`}>{value || ''}</div>

    return (
        <div className="p-2 sm:p-4 md:p-6 bg-slate-50 min-h-screen" dir="rtl">
             {!isPrinting && (
                <div className="max-w-7xl mx-auto mb-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-indigo-700">تحضير الدروس اليومية</h1>
                    <button onClick={onBackToWelcome} className="bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">العودة للرئيسية</button>
                </div>
            )}
            {!isPrinting && (
                <section className="max-w-7xl mx-auto mb-4 p-4 bg-sky-50 border border-sky-200 rounded-lg">
                    <h2 className="text-xl font-semibold text-sky-800 mb-2">التحليل باستخدام الذكاء الاصطناعي</h2>
                    <p className="text-sm text-slate-600 mb-2">
                        الصق محتوى الدرس في المربع أدناه، وسيقوم الذكاء الاصطناعي باستخلاص المعلومات وتعبئة الحقول تلقائيًا.
                    </p>
                    <textarea className="w-full h-24 p-2 border border-slate-300 rounded-md font-bold" placeholder="مثال: عنوان الدرس: الفاعل. المادة: لغة عربية. الصف: الخامس..." value={inputText} onChange={(e) => setInputText(e.target.value)} />
                    <div className="mt-2 flex items-center gap-4">
                        <button onClick={handleAnalyze} disabled={isLoading} className="bg-sky-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-sky-700 disabled:bg-sky-300 disabled:cursor-not-allowed transition-all flex items-center">{isLoading ? 'جاري التحليل...' : 'تحليل النص'}</button>
                        {error && <p className="text-red-600 font-semibold">{error}</p>}
                    </div>
                </section>
            )}

            <div id="printable-area" className={`max-w-7xl mx-auto bg-white rounded-lg shadow-lg ${isPrinting ? 'p-2 text-black' : 'p-4'}`}>
                <header className="grid grid-cols-3 items-center text-center font-bold border-b-2 border-slate-600 pb-2">
                    <div className="text-xs space-y-1 text-right">
                        <p className="font-bold text-red-800" style={titleStyle}>{lessonPlan.yemenRepublic}</p>
                        <p className="font-bold text-red-800" style={titleStyle}>{lessonPlan.ministry}</p>
                         {isPrinting ? <>
                            <p className="font-bold">المنطقة التعليمية: {lessonPlan.educationArea || '.........................'}</p>
                            <p className="font-bold">المــــدرســـــــــــــة: {lessonPlan.schoolName || '.........................'}</p>
                        </> : <>
                           <input type="text" name="educationArea" placeholder="المنطقة التعليمية" value={lessonPlan.educationArea} onChange={handleChange} className="p-1 border rounded-md text-right w-full text-xs font-bold" />
                           <input type="text" name="schoolName" placeholder="اسم المدرسة" value={lessonPlan.schoolName} onChange={handleChange} className="p-1 border rounded-md text-right w-full text-xs font-bold" />
                        </>}
                    </div>
                    <div className="flex justify-center items-center gap-4">
                        <ImageUploader image={lessonPlan.emblem1} onImageChange={(img) => setEmblem(1, img)} isPrinting={isPrinting} />
                        <ImageUploader image={lessonPlan.emblem2} onImageChange={(img) => setEmblem(2, img)} isPrinting={isPrinting} />
                    </div>
                    <div className="text-xs space-y-1 text-left">
                        {/* Empty on purpose for layout */}
                    </div>
                </header>
                
                <h2 className="text-3xl font-bold text-center my-2 text-blue-900" style={mainTitleStyle}>خطة الدرس اليومي</h2>

                <section className="p-2 border rounded-lg mb-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-1 text-xs items-center">
                        <div className="flex items-baseline gap-1"><label className="font-bold text-red-800" style={titleStyle}>المادة:</label>{isPrinting ? <p className="font-bold">{lessonPlan.subject}</p> : <select name="subject" value={lessonPlan.subject} onChange={handleChange} className="p-1 border rounded-md w-full text-xs font-bold"><option value="">اختر</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>}</div>
                        <div className="flex items-baseline gap-1 col-span-2 md:col-span-1"><label className="font-bold text-red-800" style={titleStyle}>عنوان الدرس:</label>{isPrinting ? <p className="font-bold">{lessonPlan.lessonTitle}</p> : <input name="lessonTitle" value={lessonPlan.lessonTitle} onChange={handleChange} className="p-1 border rounded-md w-full text-xs font-bold" />}</div>
                        <div className="flex items-baseline gap-1"><label className="font-bold text-red-800" style={titleStyle}>الصف:</label>{isPrinting ? <p className="font-bold">{lessonPlan.grade}</p> : <select name="grade" value={lessonPlan.grade} onChange={handleChange} className="p-1 border rounded-md w-full text-xs font-bold"><option value="">اختر</option>{GRADES.map(s => <option key={s} value={s}>{s}</option>)}</select>}</div>
                        <div className="flex items-baseline gap-1"><label className="font-bold text-red-800" style={titleStyle}>الشعبة:</label>{isPrinting ? <p className="font-bold">{lessonPlan.section}</p> : <select name="section" value={lessonPlan.section} onChange={handleChange} className="p-1 border rounded-md w-full text-xs font-bold"><option value="">اختر</option>{SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select>}</div>
                        <div className="flex items-baseline gap-1"><label className="font-bold text-red-800" style={titleStyle}>اليوم:</label>{isPrinting ? <p className="font-bold">{lessonPlan.day}</p> : <select name="day" value={lessonPlan.day} onChange={handleChange} className="p-1 border rounded-md w-full text-xs font-bold"><option value="">اختر</option>{DAYS.map(s => <option key={s} value={s}>{s}</option>)}</select>}</div>
                        <div className="flex items-baseline gap-1"><label className="font-bold text-red-800" style={titleStyle}>التاريخ:</label>{isPrinting ? <p className="font-bold">{lessonPlan.date}</p> : <input type="date" name="date" value={lessonPlan.date} onChange={handleChange} className="p-1 border rounded-md w-full text-xs font-bold" />}</div>
                        <div className="flex items-baseline gap-1"><label className="font-bold text-red-800" style={titleStyle}>الحصة:</label>{isPrinting ? <p className="font-bold">{lessonPlan.period}</p> : <select name="period" value={lessonPlan.period} onChange={handleChange} className="p-1 border rounded-md w-full text-xs font-bold"><option value="">اختر</option>{PERIODS.map(s => <option key={s} value={s}>{s}</option>)}</select>}</div>
                    </div>
                </section>
                
                <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
                    <section className="p-2 border rounded-lg space-y-2">
                        <h3 className="text-base font-bold text-red-800 border-b pb-1" style={titleStyle}>الأهداف السلوكية</h3>
                        <div><h4 className="font-bold text-red-800 mb-1 text-sm" style={titleStyle}>الأهداف المعرفية (العقلية)</h4>{renderObjectiveRows('cognitive', lessonPlan.cognitiveObjectives, BloomLevelCognitive)}</div>
                        <div><h4 className="font-bold text-red-800 mb-1 text-sm" style={titleStyle}>الأهداف المهارية (النفس حركية)</h4>{renderObjectiveRows('psychomotor', lessonPlan.psychomotorObjectives, BloomLevelPsychomotor)}</div>
                        <div><h4 className="font-bold text-red-800 mb-1 text-sm" style={titleStyle}>الأهداف الوجدانية (الانفعالية)</h4>{renderObjectiveRows('affective', lessonPlan.affectiveObjectives, BloomLevelAffective)}</div>
                    </section>

                    <section className="p-2 border rounded-lg space-y-2">
                        <h3 className="text-base font-bold text-red-800 border-b pb-1" style={titleStyle}>الوسائل والاستراتيجيات</h3>
                        <div>
                            <h4 className="font-bold text-red-800 mb-1 text-sm" style={titleStyle}>طرق التدريس</h4>
                            {isPrinting ? <div className="p-1 bg-slate-50 rounded-md text-xs font-bold">{lessonPlan.teachingMethods.join('، ')}</div> : <div className="grid grid-cols-2 md:grid-cols-4 gap-1">{TEACHING_METHODS.map(m => (<label key={m} className="flex items-center space-x-1 space-x-reverse"><input type="checkbox" checked={lessonPlan.teachingMethods.includes(m)} onChange={() => handleCheckboxChange('teachingMethods', m)} className="rounded" /><span className="text-xs">{m}</span></label>))}</div>}
                        </div>
                        <div>
                            <h4 className="font-bold text-red-800 mb-1 text-sm" style={titleStyle}>الوسائل التعليمية</h4>
                            {isPrinting ? <div className="p-1 bg-slate-50 rounded-md text-xs font-bold">{lessonPlan.teachingAids.join('، ')}</div> : <div className="space-y-2">{Object.entries(TEACHING_AIDS).map(([cat, aids]) => (<div key={cat}><p className="font-medium text-slate-600 text-xs mb-1">{cat}</p><div className="grid grid-cols-2 md:grid-cols-4 gap-1">{aids.map(aid => (<label key={aid} className="flex items-center space-x-1 space-x-reverse"><input type="checkbox" checked={lessonPlan.teachingAids.includes(aid)} onChange={() => handleCheckboxChange('teachingAids', aid)} className="rounded" /><span className="text-xs">{aid}</span></label>))}</div></div>))}</div>}
                        </div>
                    </section>
                    
                    <section className="p-2 border rounded-lg space-y-2">
                        <h3 className="text-base font-bold text-red-800 border-b pb-1" style={titleStyle}>سير الدرس</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="md:col-span-2"><label className="font-bold text-red-800 mb-1 block text-sm" style={titleStyle}>التمهيد</label>{isPrinting ? renderStaticTextarea(lessonPlan.lessonIntro, true) : <textarea name="lessonIntro" value={lessonPlan.lessonIntro} onChange={handleChange} rows={2} className="w-full p-1 border rounded-md text-sm font-bold"></textarea>}</div>
                            <div><label className="font-bold text-red-800 mb-1 block text-sm" style={titleStyle}>نوع التمهيد</label>{isPrinting ? <div className="p-1.5 border rounded-md bg-slate-50 flex items-center text-xs font-bold">{lessonPlan.introType}</div> : <select name="introType" value={lessonPlan.introType} onChange={handleChange} className="w-full p-2 border rounded-md text-sm font-bold"><option value="">اختر</option>{INTRO_TYPES.map(s => <option key={s} value={s}>{s}</option>)}</select>}</div>
                        </div>
                         <div><label className="font-bold text-red-800 mb-1 block text-sm" style={titleStyle}>محتوى الدرس والأنشطة</label>{isPrinting ? renderStaticTextarea(lessonPlan.lessonContent, true) : <textarea name="lessonContent" value={lessonPlan.lessonContent} onChange={handleChange} rows={4} className="w-full p-1 border rounded-md text-sm font-bold"></textarea>}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div><label className="font-bold text-red-800 mb-1 block text-sm" style={titleStyle}>أدوار المعلم</label>{isPrinting ? renderStaticTextarea(lessonPlan.teacherRole, true) : <textarea name="teacherRole" value={lessonPlan.teacherRole} onChange={handleChange} rows={2} className="w-full p-1 border rounded-md text-sm font-bold"></textarea>}</div>
                            <div><label className="font-bold text-red-800 mb-1 block text-sm" style={titleStyle}>أدوار الطالب</label>{isPrinting ? renderStaticTextarea(lessonPlan.studentRole, true) : <textarea name="studentRole" value={lessonPlan.studentRole} onChange={handleChange} rows={2} className="w-full p-1 border rounded-md text-sm font-bold"></textarea>}</div>
                        </div>
                    </section>

                    <section className="p-2 border rounded-lg space-y-2">
                        <h3 className="text-base font-bold text-red-800 border-b pb-1" style={titleStyle}>التقويم والخاتمة</h3>
                        <div><label className="font-bold text-red-800 mb-1 block text-sm" style={titleStyle}>الخاتمة</label>{isPrinting ? renderStaticTextarea(lessonPlan.lessonClosure, true) : <textarea name="lessonClosure" value={lessonPlan.lessonClosure} onChange={handleChange} rows={2} className="w-full p-1 border rounded-md text-sm font-bold"></textarea>}</div>
                        <div><label className="font-bold text-red-800 mb-1 block text-sm" style={titleStyle}>الواجب المنزلي</label>{isPrinting ? renderStaticTextarea(lessonPlan.homework, true) : <textarea name="homework" value={lessonPlan.homework} onChange={handleChange} rows={2} className="w-full p-1 border rounded-md text-sm font-bold"></textarea>}</div>
                    </section>

                    <footer className="pt-2">
                        <div className="text-left text-xs font-bold">
                            {isPrinting ? 
                                <p className="font-bold">المعلم/ة: {lessonPlan.teacherName || '.........................'}</p> : 
                                <div className="flex items-center justify-end gap-2">
                                    <label className="font-bold text-red-800" style={titleStyle}>اسم المعلم/ة:</label>
                                    <input type="text" name="teacherName" placeholder="اسم المعلم" value={lessonPlan.teacherName} onChange={handleChange} className="p-1 border rounded-md text-right w-1/3 text-xs font-bold" />
                                </div>
                            }
                        </div>
                    </footer>
                </form>
            </div>
            
             {!isPrinting &&
                <div className="flex justify-end mt-4 max-w-7xl mx-auto space-x-4 space-x-reverse">
                    <button type="button" onClick={handleSave} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">حفظ الخطة</button>
                    <button type="button" onClick={handleExportPdf} disabled={isExporting} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 flex items-center justify-center min-w-[140px]">
                        {isExporting ? 'جاري التصدير...' : 'تصدير PDF'}
                    </button>
                </div>
            }
        </div>
    );
};

export default LessonPlanner;