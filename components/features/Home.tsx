import React from 'react';
import ExerciseProgramTracker from '../widgets/ExerciseProgramTracker';
import CurrentWeekPlan from '../widgets/CurrentWeekPlan';
import type { ExercisePlan } from '../../types';

interface ProgramProgress {
    progressPercent: number;
    currentWeek: number;
    completedSessions: number;
    totalWeeks: number;
    sessionsPerWeek: number;
    weeklyCompletions: number[];
}

interface HomeProps {
    progressData: ProgramProgress;
    onUpdateProgress: () => void;
    onNavigate: (tab: 'journal' | 'tele' | 'exercise') => void;
    activePlan: ExercisePlan | null;
}

const Home: React.FC<HomeProps> = ({ progressData, onUpdateProgress, onNavigate, activePlan }) => {
    const isCompleted = activePlan ? (progressData.completedSessions >= progressData.totalWeeks * progressData.sessionsPerWeek) : true;
    
    return (
        <div>
            {activePlan ? (
                <>
                    <ExerciseProgramTracker progressData={progressData} />
                    <CurrentWeekPlan plan={activePlan} currentWeek={progressData.currentWeek} />
                    <button
                        onClick={onUpdateProgress}
                        disabled={isCompleted}
                        title={isCompleted ? "Program Complete!" : "Log a Session"}
                        aria-label={isCompleted ? "Program Complete!" : "Log a Session"}
                        className="fixed bottom-24 right-6 bg-[#00bfa5] text-white font-bold w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:bg-[#00a794] transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#00c4cc]/50 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100 disabled:hover:scale-100 z-10"
                    >
                       {isCompleted ? <i className="fas fa-check text-2xl"></i> : <i className="fas fa-plus text-2xl"></i>}
                    </button>
                </>
            ) : (
                <div className="text-center p-8 bg-gray-50 rounded-2xl">
                    <i className="fas fa-dumbbell text-5xl text-[#00bfa5] mb-4"></i>
                    <h2 className="text-2xl font-bold text-[#37474f] mb-2">No Active Exercise Plan</h2>
                    <p className="text-[#78909c] mb-6">
                        Get started by generating a personalized physiotherapy program.
                    </p>
                    <button 
                        className="bg-[#00838f] text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-800 transition-colors"
                        onClick={() => onNavigate('exercise')}
                    >
                        Generate New Plan
                    </button>
                </div>
            )}
            
            <div className="mt-8">
                <h3 className="text-xl font-bold text-[#37474f] mb-4 text-center">More Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                        className="flex flex-col items-center justify-center text-center p-6 rounded-xl shadow-md cursor-pointer transition-all duration-300 transform bg-white text-[#37474f] hover:bg-gray-50 hover:scale-105"
                        onClick={() => onNavigate('journal')}
                        role="button"
                        tabIndex={0}
                        aria-label="Go to Journal Link"
                    >
                        <i className="fas fa-book-open text-4xl mb-3 text-[#00838f]"></i>
                        <h4 className="font-semibold text-lg">Journal Link</h4>
                        <p className="text-sm text-[#78909c]">Access trusted medical journals.</p>
                    </div>
                    <div 
                        className="flex flex-col items-center justify-center text-center p-6 rounded-xl shadow-md cursor-pointer transition-all duration-300 transform bg-white text-[#37474f] hover:bg-gray-50 hover:scale-105"
                        onClick={() => onNavigate('tele')}
                        role="button"
                        tabIndex={0}
                        aria-label="Go to TelePhysio"
                    >
                        <i className="fas fa-video text-4xl mb-3 text-[#00838f]"></i>
                        <h4 className="font-semibold text-lg">TelePhysio</h4>
                        <p className="text-sm text-[#78909c]">Start a virtual consultation.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;