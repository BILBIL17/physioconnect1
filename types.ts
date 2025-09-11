
export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  notes: string;
}

export interface WeeklyPlan {
  week: number;
  focus: string;
  exercises: Exercise[];
}

export interface ExercisePlan {
  planTitle: string;
  durationWeeks: number;
  weeklyPlans: WeeklyPlan[];
}

export interface Journal {
    id: number;
    title: string;
    publisher: string;
    year: number;
    link: string;
}

export interface PostureAnalysisResult {
    deviations: {
        area: string;
        deviation: string;
    }[];
    riskLevel: 'Low' | 'Medium' | 'High';
    recommendations: string[];
}
