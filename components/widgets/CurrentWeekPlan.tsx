import React from 'react';
import type { ExercisePlan } from '../../types';

interface CurrentWeekPlanProps {
    plan: ExercisePlan;
    currentWeek: number;
}

const CurrentWeekPlan: React.FC<CurrentWeekPlanProps> = ({ plan, currentWeek }) => {
    const weeklyPlan = plan.weeklyPlans.find(wp => wp.week === currentWeek);

    if (!weeklyPlan) {
        return (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center">
                <p>Could not find the plan for the current week.</p>
            </div>
        );
    }

    return (
        <div className="mt-8 border-t-2 border-gray-100 pt-6">
            <h3 className="text-xl font-bold text-[#37474f] mb-4">
                This Week's Focus (Week {weeklyPlan.week}): <span className="text-[#00838f]">{weeklyPlan.focus}</span>
            </h3>
            <div className="space-y-4">
                {weeklyPlan.exercises.map((ex, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-semibold text-lg text-[#37474f]">{ex.name}</p>
                        <p className="text-sm text-[#78909c] font-medium my-1">
                            Sets: <span className="font-bold">{ex.sets}</span> | Reps: <span className="font-bold">{ex.reps}</span>
                        </p>
                        <p className="text-sm text-gray-600">{ex.notes}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CurrentWeekPlan;