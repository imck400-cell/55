
export interface Objective {
  id: string;
  level: string;
  formulation: string;
  evaluation: string;
}

export interface LessonPlan {
  id: string;
  emblem1: string | null;
  emblem2: string | null;
  yemenRepublic: string;
  ministry: string;
  educationArea: string;
  schoolName: string;
  day: string;
  date: string;
  subject: string;
  lessonTitle: string;
  grade: string;
  section: string;
  period: string;
  behavior: string;
  teachingMethods: string[];
  teachingAids: string[];
  lessonIntro: string;
  introType: string;
  activities: string;
  cognitiveObjectives: Objective[];
  psychomotorObjectives: Objective[];
  affectiveObjectives: Objective[];
  teacherRole: string;
  studentRole: string;
  lessonContent: string;
  lessonClosure: string;
  closureType: string;
  homework: string;
  homeworkType: string;
  adminNotes: string;
  praise: string;
  teacherName: string;
}

export enum BloomLevelCognitive {
  Remember = "التذكر",
  Understand = "الفهم",
  Apply = "التطبيق",
  Analyze = "التحليل",
  Synthesize = "التركيب",
  Evaluate = "التقويم",
}

export enum BloomLevelPsychomotor {
    Observation = "الملاحظة",
    Imitation = "المحاكاة",
    Performance = "الأداء",
    Accuracy = "الدقة",
    Mastery = "الإتقان",
    Creativity = "الإبداع",
}

export enum BloomLevelAffective {
    Receiving = "الاستقبال",
    Responding = "الاستجابة",
    Valuing = "التقدير",
    Organization = "التنظيم",
    Characterization = "التمثل",
}
