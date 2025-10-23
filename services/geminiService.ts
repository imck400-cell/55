import { GoogleGenAI, Type } from "@google/genai";
import type { LessonPlan, Objective } from '../types';

const initialObjective: Objective = { id: Date.now().toString(), level: '', formulation: '', evaluation: '' };

// This function converts a lesson plan text into a structured JSON object.
export async function analyzeLessonPlanWithGemini(lessonText: string): Promise<Partial<LessonPlan>> {
    // In deployment environments like Vercel, `process` is not defined in the browser,
    // which would cause a crash. This check prevents that and provides a clear error
    // message if the API key is missing, guiding the user to configure their environment.
    if (typeof process === 'undefined' || !process.env.API_KEY) {
        console.error("API_KEY is not defined. Please ensure it is set in your deployment environment variables.");
        throw new Error("لم يتم العثور على مفتاح الواجهة البرمجية (API Key). يرجى التأكد من إعداده في متغيرات البيئة الخاصة بنشر التطبيق.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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
    You must analyze the provided lesson text and fill in all fields in the JSON schema. If a specific detail (like 'teaching aids' or 'teacher role') is missing from the text, you MUST infer and generate appropriate content based on the lesson's subject, grade level, and topic. For example, for a 5th-grade Arabic lesson about poetry, you might suggest 'whiteboard, markers, poetry anthology' as teaching aids. Do not leave any fields empty; provide logical and relevant suggestions for all of them. Ensure the objectives you generate are well-formed and appropriate for the lesson.

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
        const parsedResult = JSON.parse(jsonString);
        
        // Ensure objectives arrays are not undefined and have unique IDs
        parsedResult.cognitiveObjectives = (parsedResult.cognitiveObjectives || []).map((o: any, i: number) => ({...o, id: `cog-${Date.now()}-${i}`}));
        parsedResult.psychomotorObjectives = (parsedResult.psychomotorObjectives || []).map((o: any, i: number) => ({...o, id: `psy-${Date.now()}-${i}`}));
        parsedResult.affectiveObjectives = (parsedResult.affectiveObjectives || []).map((o: any, i: number) => ({...o, id: `aff-${Date.now()}-${i}`}));

        return parsedResult;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to analyze lesson plan with Gemini.");
    }
}