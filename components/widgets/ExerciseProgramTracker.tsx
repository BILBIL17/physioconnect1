import React from 'react';
import ProgressChart from './ProgressChart';

interface ProgramProgress {
    progressPercent: number;
    currentWeek: number;
    completedSessions: number;
    totalWeeks: number;
    sessionsPerWeek: number;
    weeklyCompletions: number[];
}

interface ExerciseProgramTrackerProps {
    progressData: ProgramProgress;
}

const ExerciseProgramTracker: React.FC<ExerciseProgramTrackerProps> = ({ progressData }) => {
    const totalSessions = progressData.totalWeeks * progressData.sessionsPerWeek;
    const isCompleted = progressData.completedSessions >= totalSessions;

    const remainingSessionsInWeek = isCompleted ? 0 : progressData.sessionsPerWeek - (progressData.completedSessions % progressData.sessionsPerWeek);
    // Adjust display for the last session of a week
    const displayRemainingSessions = (remainingSessionsInWeek === progressData.sessionsPerWeek && progressData.completedSessions > 0 && !isCompleted) ? 0 : remainingSessionsInWeek;
    
    const chartLabels = Array.from({ length: progressData.totalWeeks }, (_, i) => `W${i + 1}`);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#37474f]">Exercise Program Tracker</h2>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                    className="bg-[#00838f] h-4 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progressData.progressPercent}%` }}
                ></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                    <p className="text-2xl font-bold text-[#00838f]">{progressData.progressPercent}%</p>
                    <p className="text-sm text-[#78909c]">Completed</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-[#37474f]">Week {progressData.currentWeek}/{progressData.totalWeeks}</p>
                    <p className="text-sm text-[#78909c]">Current Week</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-[#37474f]">{progressData.completedSessions}</p>
                    <p className="text-sm text-[#78909c]">Total Sessions</p>
                </div>
                 <div>
                    <p className="text-2xl font-bold text-[#37474f]">{displayRemainingSessions}</p>
                    <p className="text-sm text-[#78909c]">Sessions Left (Week)</p>
                </div>
            </div>

            <div className="mt-6 border-t pt-4">
                <ProgressChart 
                    data={progressData.weeklyCompletions} 
                    labels={chartLabels}
                    target={progressData.sessionsPerWeek}
                />
            </div>
        </div>
    );
};

export default ExerciseProgramTracker;