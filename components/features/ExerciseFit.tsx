import React, { useState } from 'react';
import { generateExercisePlan } from '../../services/geminiService';
import type { ExercisePlan } from '../../types';
import FooterDisclaimer from '../shared/FooterDisclaimer';

interface ExerciseFitProps {
    onAcceptPlan: (plan: ExercisePlan) => void;
}

const complaintOptions = [
    // Full Body / General
    "Improve posture",
    "General flexibility and mobility",
    "Core strengthening",
    "Improve overall balance and coordination",
    "Post-surgical rehabilitation (general)",
    // Upper Body
    "Mild lower back pain and stiffness",
    "Upper back and neck tension",
    "Shoulder mobility improvement",
    "Wrist and hand strengthening (for office work)",
    "Elbow pain (e.g., Tennis Elbow)",
    // Lower Body
    "Hip flexibility and strength",
    "Knee stability and pain reduction",
    "Ankle sprain recovery",
    "Foot pain (e.g., Plantar Fasciitis)",
];


const ExerciseFit: React.FC<ExerciseFitProps> = ({ onAcceptPlan }) => {
    const [age, setAge] = useState('35');
    const [complaints, setComplaints] = useState(complaintOptions[0]);
    const [activityLevel, setActivityLevel] = useState('Sedentary (office job)');
    const [plan, setPlan] = useState<ExercisePlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setPlan(null);
        try {
            const generatedPlan = await generateExercisePlan(age, complaints, activityLevel);
            setPlan(generatedPlan);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptClick = () => {
        if(plan) {
            onAcceptPlan(plan);
        }
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-[#37474f] mb-4">Exercise Fit Program Generator</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-[#78909c] text-sm font-bold mb-2">Age</label>
                    <input type="text" value={age} onChange={e => setAge(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white" />
                </div>
                <div>
                    <label className="block text-[#78909c] text-sm font-bold mb-2">Complaints / Goals</label>
                    <select value={complaints} onChange={e => setComplaints(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                        {complaintOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-[#78909c] text-sm font-bold mb-2">Activity Level</label>
                    <select value={activityLevel} onChange={e => setActivityLevel(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                        <option>Sedentary (office job)</option>
                        <option>Lightly Active (walks 1-2 times/week)</option>
                        <option>Moderately Active (exercises 3-4 times/week)</option>
                        <option>Very Active (exercises 5+ times/week)</option>
                    </select>
                </div>
                <div className="md:col-span-3">
                    <button type="submit" disabled={isLoading} className="w-full bg-[#00838f] text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-800 disabled:bg-gray-400 transition-colors">
                        {isLoading ? 'Generating Your Plan...' : 'Generate AI Program'}
                    </button>
                </div>
            </form>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">{error}</div>}
            
            {plan && (
                <div className="mt-8 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-[#37474f]">{plan.planTitle}</h3>
                        <button onClick={handleAcceptClick} className="bg-green-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                            <i className="fas fa-plus-circle mr-2"></i> Add Program to Dashboard
                        </button>
                    </div>
                    
                    <div className="space-y-6">
                        {plan.weeklyPlans.map(week => (
                            <div key={week.week} className="border border-[#e0e0e0] rounded-lg p-4">
                                <h4 className="font-bold text-lg text-[#00838f]">Week {week.week}: {week.focus}</h4>
                                <ul className="mt-2 space-y-2">
                                    {week.exercises.map(ex => (
                                        <li key={ex.name} className="p-3 bg-gray-50 rounded">
                                            <p className="font-semibold">{ex.name} - {ex.sets} sets of {ex.reps} reps</p>
                                            <p className="text-sm text-[#78909c]">{ex.notes}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <FooterDisclaimer />
        </div>
    );
}

export default ExerciseFit;