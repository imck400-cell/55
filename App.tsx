
import React, { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import LessonPlanner from './components/LessonPlanner';
import type { LessonPlan } from './types';

export type View = 'welcome' | 'planner';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('welcome');
    const [lessonToLoad, setLessonToLoad] = useState<LessonPlan | null>(null);

    const handleNavigate = (view: View, lesson: LessonPlan | null = null) => {
        setLessonToLoad(lesson);
        setCurrentView(view);
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800">
            {currentView === 'welcome' && <WelcomeScreen onNavigate={handleNavigate} />}
            {currentView === 'planner' && <LessonPlanner lesson={lessonToLoad} onBackToWelcome={() => handleNavigate('welcome')} />}
        </div>
    );
};

export default App;
