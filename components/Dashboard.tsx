import React, { useState, useEffect, useRef } from 'react';
import Home from './features/Home';
import ExerciseFit from './features/ExerciseFit';
import NearTherapy from './features/NearTherapy';
import PostureIQ from './features/PostureIQ';
import TelePhysio from './features/TelePhysio';
import JournalLink from './features/JournalLink';
import NavItem from './shared/NavItem';
import ProfileModal from './shared/ProfileModal';
import type { AiProvider } from '../../App';
import type { ExercisePlan } from '../../types';

type Tab = 'home' | 'exercise' | 'posture' | 'therapy' | 'journal' | 'tele';

interface ProgramProgress {
    progressPercent: number;
    currentWeek: number;
    completedSessions: number;
    totalWeeks: number;
    sessionsPerWeek: number;
    weeklyCompletions: number[];
}

interface DashboardProps {
    onLogout: () => void;
    aiProvider: AiProvider;
    geminiApiKey: string;
    openAiApiKey: string;
    groqApiKey: string;
    customApiKey: string;
    customApiBaseUrl: string;
    customApiModel: string;
    onAiSettingsSave: (
        provider: AiProvider, 
        geminiKey: string, 
        openAiKey: string, 
        groqKey: string, 
        customKey: string, 
        customBaseUrl: string, 
        customModel: string
    ) => void;
}

const TABS: { [key in Tab]: { title: string; component: React.FC<any>; icon: string; } } = {
    home: { title: "Dashboard", component: Home, icon: "fa-home" },
    exercise: { title: "Exercise Fit", component: ExerciseFit, icon: "fa-dumbbell" },
    posture: { title: "Posture IQ", component: PostureIQ, icon: "fa-user-check" },
    therapy: { title: "Near Therapy", component: NearTherapy, icon: "fa-map-location-dot" },
    journal: { title: "Journal Link", component: JournalLink, icon: "fa-book-open" },
    tele: { title: "TelePhysio", component: TelePhysio, icon: "fa-video" },
};

const NAV_ITEMS: Tab[] = ['home', 'exercise', 'posture', 'therapy'];

const Dashboard: React.FC<DashboardProps> = ({ 
    onLogout, 
    aiProvider, 
    geminiApiKey, 
    openAiApiKey, 
    groqApiKey,
    customApiKey,
    customApiBaseUrl,
    customApiModel, 
    onAiSettingsSave 
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [showScrollTopButton, setShowScrollTopButton] = useState(false);
    const mainContentRef = useRef<HTMLElement>(null);
    
    const PROGRESS_STORAGE_KEY = 'physcio-program-progress';
    const PLAN_STORAGE_KEY = 'physcio-active-plan';

    const [activePlan, setActivePlan] = useState<ExercisePlan | null>(() => {
        try {
            const savedPlan = localStorage.getItem(PLAN_STORAGE_KEY);
            return savedPlan ? JSON.parse(savedPlan) : null;
        } catch (error) {
            console.error("Failed to parse active plan from localStorage", error);
            return null;
        }
    });

    const [progressData, setProgressData] = useState<ProgramProgress>(() => {
        try {
            const savedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
            if (savedProgress) {
                const parsed = JSON.parse(savedProgress);
                if (typeof parsed.progressPercent === 'number' && Array.isArray(parsed.weeklyCompletions)) {
                    return parsed;
                }
            }
        } catch (error) {
            console.error("Failed to parse progress from localStorage", error);
        }
        return {
            progressPercent: 0,
            currentWeek: 1,
            completedSessions: 0,
            totalWeeks: activePlan?.durationWeeks || 4,
            sessionsPerWeek: 3,
            weeklyCompletions: Array(activePlan?.durationWeeks || 4).fill(0),
        };
    });

    useEffect(() => {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressData));
    }, [progressData]);
    
    useEffect(() => {
        if(activePlan) {
            localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(activePlan));
        } else {
            localStorage.removeItem(PLAN_STORAGE_KEY);
        }
    }, [activePlan]);

    useEffect(() => {
        const mainEl = mainContentRef.current;
        if (!mainEl) return;

        const handleScroll = () => {
            if (mainEl.scrollTop > 300) {
                setShowScrollTopButton(true);
            } else {
                setShowScrollTopButton(false);
            }
        };

        mainEl.addEventListener('scroll', handleScroll);
        
        return () => {
            mainEl.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        mainContentRef.current?.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const updateProgress = () => {
        setProgressData(prev => {
            const totalSessions = prev.totalWeeks * prev.sessionsPerWeek;
            if (prev.completedSessions >= totalSessions) {
                alert("Congratulations! You've completed your exercise program.");
                return prev;
            }

            const newCompletedSessions = prev.completedSessions + 1;
            const newProgressPercent = Math.round((newCompletedSessions / totalSessions) * 100);
            
            const newWeeklyCompletions = [...prev.weeklyCompletions];
            const weekIndexToUpdate = Math.floor(prev.completedSessions / prev.sessionsPerWeek);

            if (weekIndexToUpdate < newWeeklyCompletions.length) {
                const sessionsInPreviousWeeks = weekIndexToUpdate * prev.sessionsPerWeek;
                const sessionsCompletedInCurrentWeek = prev.completedSessions - sessionsInPreviousWeeks;
                newWeeklyCompletions[weekIndexToUpdate] = sessionsCompletedInCurrentWeek + 1;
            }
            
            const newCurrentWeek = Math.min(prev.totalWeeks, Math.floor(newCompletedSessions / prev.sessionsPerWeek) + 1);

            return {
                ...prev,
                completedSessions: newCompletedSessions,
                currentWeek: newCurrentWeek,
                progressPercent: newProgressPercent,
                weeklyCompletions: newWeeklyCompletions,
            };
        });
    };
    
    const handleAcceptPlan = (plan: ExercisePlan) => {
        setActivePlan(plan);
        const newProgress = {
            progressPercent: 0,
            currentWeek: 1,
            completedSessions: 0,
            totalWeeks: plan.durationWeeks,
            sessionsPerWeek: 3, // Default sessions per week
            weeklyCompletions: Array(plan.durationWeeks).fill(0),
        };
        setProgressData(newProgress);
        alert("Program added to your dashboard!");
        setActiveTab('home');
    };

    const ActiveComponent = TABS[activeTab].component;
    const componentProps = {
        home: { 
            progressData: progressData, 
            onUpdateProgress: updateProgress,
            onNavigate: (tab: Tab) => setActiveTab(tab),
            activePlan: activePlan,
        },
        exercise: {
            onAcceptPlan: handleAcceptPlan,
        },
        posture: {},
        therapy: {},
        journal: {},
        tele: {},
    }[activeTab];


    return (
        <div className="flex flex-col min-h-screen bg-[#f4f7f6]">
            <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-center text-[#37474f]">{TABS[activeTab].title}</h1>
            </header>

            <main ref={mainContentRef} className="flex-grow p-4 md:p-6 pb-24 overflow-y-auto">
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
                    <ActiveComponent {...componentProps} />
                </div>
            </main>
            
            {showScrollTopButton && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-24 left-6 bg-[#00838f] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-teal-800 transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#00838f]/50 z-10 animate-fade-in-fast"
                    aria-label="Scroll to top"
                >
                    <i className="fas fa-arrow-up text-xl"></i>
                </button>
            )}

            <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-around items-center h-20 z-20">
                {NAV_ITEMS.map(tabKey => (
                     <NavItem 
                        key={tabKey}
                        label={TABS[tabKey].title}
                        icon={TABS[tabKey].icon}
                        isActive={activeTab === tabKey}
                        onClick={() => setActiveTab(tabKey)}
                     />
                ))}
                <NavItem 
                    label="Profile"
                    icon="fa-user-cog"
                    isActive={isProfileModalOpen}
                    onClick={() => setIsProfileModalOpen(true)}
                />
            </nav>

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onLogout={onLogout}
                aiProvider={aiProvider}
                geminiApiKey={geminiApiKey}
                openAiApiKey={openAiApiKey}
                groqApiKey={groqApiKey}
                customApiKey={customApiKey}
                customApiBaseUrl={customApiBaseUrl}
                customApiModel={customApiModel}
                onAiSettingsSave={onAiSettingsSave}
            />
        </div>
    );
};

export default Dashboard;