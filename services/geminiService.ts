import { GoogleGenAI, Type } from "@google/genai";
import type { LessonPlan } from '../types';

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// This function converts a lesson plan text into a structured JSON object.
export async function analyzeLessonPlanWithGemini(lessonText: string): Promise<Partial<LessonPlan>> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("لم يتم تكوين مفتاح Gemini API. يرجى التأكد من إعداده في متغيرات بيئة النشر.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const objectiveSchema = {
        type: Type.OBJECT,
        properties: {
            level: { type: Type.STRING, description: "The Bloom's Taxonomy level of the objective." },
            formulation: { type: Type.STRING, description: "The exact wording of the behavioral objective." },
            evaluation: { type: Type.STRING, description: "The method or question to evaluate if the objective was met." },
        },
        required: ["level", "formulation", "evaluation"]
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            lessonTitle: { type: Type.STRING, description: "The main title of the lesson." },
            subject: { type: Type.STRING, description: "The subject matter (e.g., 'اللغة العربية')." },
            grade: { type: Type.STRING, description: "The target grade level (e.g., 'الصف الخامس الابتدائي')." },
            educationArea: { type: Type.STRING, description: "The educational area or district (e.g., 'مكتب التربية بأمانة العاصمة')." },
            schoolName: { type: Type.STRING, description: "The name of the school." },
            teacherName: { type: Type.STRING, description: "The name of the teacher." },
            section: { type: Type.STRING, description: "The class section (e.g., 'أ', 'ب', '1')." },
            period: { type: Type.STRING, description: "The class period (e.g., 'الأولى', 'الثانية')." },
            date: { type: Type.STRING, description: "The date of the lesson in YYYY-MM-DD format." },
            teachingMethods: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of teaching methods and strategies used."},
            teachingAids: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of teaching aids or materials mentioned."},
            lessonIntro: { type: Type.STRING, description: "A summary of the lesson's introduction or warm-up activity." },
            introType: { type: Type.STRING, description: "The type of introduction (e.g., 'سؤال', 'قصة')." },
            cognitiveObjectives: { type: Type.ARRAY, items: objectiveSchema, description: "List of cognitive objectives from the lesson plan." },
            psychomotorObjectives: { type: Type.ARRAY, items: objectiveSchema, description: "List of psychomotor (skill-based) objectives." },
            affectiveObjectives: { type: Type.ARRAY, items: objectiveSchema, description: "List of affective (emotional/value-based) objectives." },
            teacherRole: { type: Type.STRING, description: "A summary of the teacher's role during the lesson."},
            studentRole: { type: Type.STRING, description: "A summary of the student's role during the lesson."},
            lessonContent: { type: Type.STRING, description: "A detailed summary of the core content and activities of the lesson." },
            lessonClosure: { type: Type.STRING, description: "A summary of the lesson's closing activity."},
            homework: { type: Type.STRING, description: "The homework assignment given to students." },
        },
    };

    const prompt = `
    You are an expert educational assistant specializing in analyzing and structuring lesson plans for Yemeni teachers.
    Your task is to analyze the following lesson plan text and extract the required information into a structured JSON format.
    You must analyze the provided lesson text and fill in all fields in the JSON schema. If a specific detail is missing from the text, you MUST infer and generate appropriate, logical content based on the lesson's subject, grade level, and topic. For example, for a 5th-grade Arabic lesson about poetry, you might suggest 'whiteboard, markers, poetry anthology' as teaching aids. Do not leave any fields empty; provide logical and relevant suggestions for all of them. Ensure the objectives you generate are well-formed and appropriate for the lesson.
    For the 'date' field, ensure it is in YYYY-MM-DD format. Do not include the 'day' field in your JSON output; it will be calculated automatically.

    The lesson plan is:
    ---
    ${lessonText}
    ---
    Please extract the information according to the provided JSON schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonString = response.text.trim();
        const parsedResult = JSON.parse(jsonString) as Partial<LessonPlan>;
        
        // Ensure objectives arrays are not undefined and have unique IDs
        parsedResult.cognitiveObjectives = (parsedResult.cognitiveObjectives || []).map((o: any, i: number) => ({...o, id: `cog-${Date.now()}-${i}`}));
        parsedResult.psychomotorObjectives = (parsedResult.psychomotorObjectives || []).map((o: any, i: number) => ({...o, id: `psy-${Date.now()}-${i}`}));
        parsedResult.affectiveObjectives = (parsedResult.affectiveObjectives || []).map((o: any, i: number) => ({...o, id: `aff-${Date.now()}-${i}`}));
        
        // Auto-update day based on date if Gemini provides a date
        if (parsedResult.date) {
            try {
                const dateObj = new Date(parsedResult.date + 'T00:00:00');
                const dayIndex = dateObj.getUTCDay();
                parsedResult.day = DAYS[dayIndex];
            } catch (e) {
                console.warn("Could not parse date from AI response to set day.", e);
            }
        }

        return parsedResult;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
             throw new Error("مفتاح API غير صالح. يرجى التحقق من المفتاح في إعدادات البيئة الخاصة بك.");
        }
        throw new Error("فشل تحليل خطة الدرس. يرجى المحاولة مرة أخرى أو التحقق من مفتاح API.");
    }
}
