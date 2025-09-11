import { GoogleGenAI, Type } from "@google/genai";
import type { ExercisePlan, PostureAnalysisResult } from '../types';

let activeProvider: 'gemini' | 'openai' | 'groq' | 'custom' | null = null;
let geminiAi: GoogleGenAI | null = null;
let customApiKey: string | null = null;
let customApiBaseUrl: string | null = null;
let customApiModel: string | null = null;


export const initializeAi = (provider: string, apiKey: string, baseUrl?: string, modelName?: string) => {
    if (!apiKey) {
        activeProvider = null;
        geminiAi = null;
        return;
    }
    if (provider === 'gemini') {
        try {
            geminiAi = new GoogleGenAI({ apiKey });
            activeProvider = 'gemini';
        } catch (error) {
            console.error("Failed to initialize GoogleGenAI:", error);
            geminiAi = null;
            activeProvider = null;
        }
    } else if (provider === 'openai') {
        // In a real app, you would initialize the OpenAI client here.
        activeProvider = 'openai';
        geminiAi = null; // Ensure gemini client is not used
    } else if (provider === 'groq') {
        // In a real app, you would initialize the Groq client here.
        activeProvider = 'groq';
        geminiAi = null; // Ensure gemini client is not used
    } else if (provider === 'custom') {
        if (apiKey && baseUrl && modelName) {
            activeProvider = 'custom';
            customApiKey = apiKey;
            customApiBaseUrl = baseUrl;
            customApiModel = modelName;
            geminiAi = null;
        } else {
             activeProvider = null; // Incomplete details
        }
    } else {
        activeProvider = null;
        geminiAi = null;
    }
};

const exercisePlanSchema = {
  type: Type.OBJECT,
  properties: {
    planTitle: { type: Type.STRING, description: "A catchy title for the 4-week exercise plan." },
    durationWeeks: { type: Type.INTEGER, description: "The total duration of the plan in weeks, which should be 4." },
    weeklyPlans: {
      type: Type.ARRAY,
      description: "An array of weekly plans, one for each of the 4 weeks.",
      items: {
        type: Type.OBJECT,
        properties: {
          week: { type: Type.INTEGER, description: "The week number (1, 2, 3, or 4)." },
          focus: { type: Type.STRING, description: "The main focus for this week (e.g., 'Mobility and Pain Reduction', 'Strength Building')." },
          exercises: {
            type: Type.ARRAY,
            description: "A list of exercises for the week.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the exercise." },
                sets: { type: Type.STRING, description: "Number of sets (e.g., '3')." },
                reps: { type: Type.STRING, description: "Number of repetitions per set (e.g., '10-12')." },
                notes: { type: Type.STRING, description: "Brief instructions or points of focus for the exercise." },
              },
              required: ["name", "sets", "reps", "notes"],
            },
          },
        },
        required: ["week", "focus", "exercises"],
      },
    },
  },
  required: ["planTitle", "durationWeeks", "weeklyPlans"],
};

const generateExercisePlanWithGemini = async (age: string, complaints: string, activityLevel: string): Promise<ExercisePlan> => {
  if (!geminiAi) {
    throw new Error("Gemini AI Service not initialized. Please set your API Key in the profile settings.");
  }
  
  const prompt = `
    Generate a 4-week physiotherapy exercise plan for a person with the following details:
    - Age: ${age}
    - Health Complaints/Goals: ${complaints}
    - Current Activity Level: ${activityLevel}

    The plan should be safe, progressive, and tailored to these details. Ensure it includes a mix of mobility, strengthening, and stretching exercises. 
    The output must strictly follow the provided JSON schema.
  `;

  try {
    const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: exercisePlanSchema,
        },
    });
    
    const jsonString = response.text.trim();
    if (!jsonString) {
      throw new Error("Received an empty response from the AI model.");
    }

    const plan = JSON.parse(jsonString);

    if (!plan.weeklyPlans || plan.weeklyPlans.length !== 4) {
      throw new Error("AI response did not generate a valid 4-week plan.");
    }
    
    return plan;

  } catch (error) {
    console.error("Error generating exercise plan with Gemini:", error);
    throw new Error("Failed to generate exercise plan. Please check your API Key or try again later.");
  }
};

const postureAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        deviations: {
            type: Type.ARRAY,
            description: "List of identified postural deviations.",
            items: {
                type: Type.OBJECT,
                properties: {
                    area: { type: Type.STRING, description: "Body area with the deviation (e.g., 'Head', 'Shoulders', 'Pelvis')." },
                    deviation: { type: Type.STRING, description: "Description of the deviation (e.g., 'Forward Head Posture', 'Rounded Shoulders')." },
                },
                required: ["area", "deviation"],
            }
        },
        riskLevel: { 
            type: Type.STRING, 
            description: "Overall risk assessment of the posture.",
            enum: ['Low', 'Medium', 'High'],
        },
        recommendations: {
            type: Type.ARRAY,
            description: "Actionable recommendations and exercises to correct the posture.",
            items: {
                type: Type.STRING,
            }
        }
    },
    required: ["deviations", "riskLevel", "recommendations"],
};

const analyzePostureWithGemini = async (base64ImageData: string, mimeType: string): Promise<PostureAnalysisResult> => {
    if (!geminiAi) {
        throw new Error("Gemini AI Service not initialized. Please set your API Key in the profile settings.");
    }
    
    const prompt = `
        Analyze the posture of the person in this image. 
        Identify key postural deviations from a side-view perspective.
        Assess the overall risk level as Low, Medium, or High.
        Provide actionable recommendations, including specific exercises, to help correct these deviations.
        The output must strictly follow the provided JSON schema.
    `;

    const imagePart = {
        inlineData: {
            data: base64ImageData,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: prompt,
    };
    
    try {
        const response = await geminiAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: postureAnalysisSchema,
            },
        });

        const jsonString = response.text.trim();
        if (!jsonString) {
            throw new Error("Received an empty response from the AI model.");
        }
        
        const result = JSON.parse(jsonString);

        if (!result.deviations || !result.riskLevel || !result.recommendations) {
            throw new Error("AI response is missing required fields for posture analysis.");
        }

        return result;

    } catch (error) {
        console.error("Error analyzing posture with Gemini:", error);
        throw new Error("Failed to analyze posture. The image might be unclear or the service is unavailable.");
    }
};


// --- Custom Provider Logic ---

const generateContentWithCustomProvider = async (prompt: string, base64ImageData?: string, mimeType?: string): Promise<any> => {
    if (!customApiBaseUrl || !customApiKey || !customApiModel) {
        throw new Error("Custom AI Provider is not configured correctly. Please check API Base URL, Key, and Model Name in settings.");
    }

    const endpoint = `${customApiBaseUrl.replace(/\/$/, '')}/chat/completions`;

    const contentParts: any[] = [{ type: 'text', text: prompt }];
    if (base64ImageData && mimeType) {
        contentParts.push({
            type: 'image_url',
            image_url: {
                url: `data:${mimeType};base64,${base64ImageData}`
            }
        });
    }

    const body = {
        model: customApiModel,
        messages: [{ role: 'user', content: contentParts }],
        response_format: { type: 'json_object' },
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customApiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Custom provider API error:", errorBody);
            throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error("Received an empty or invalid response from the custom AI model.");
        }
        
        return JSON.parse(content);
    } catch (error) {
        console.error("Error with Custom AI Provider:", error);
        throw new Error("Failed to generate content with the custom provider. Please check your settings and network connection.");
    }
};

// --- Generic Functions ---
const throwOpenAIError = () => {
    throw new Error("OpenAI is not implemented in this version. Please select Google Gemini as the AI provider.");
};
const throwGroqError = () => {
    throw new Error("Groq is not implemented in this version. Please select Google Gemini as the AI provider.");
};

export const generateExercisePlan = async (age: string, complaints: string, activityLevel: string): Promise<ExercisePlan> => {
    if (activeProvider === 'gemini') {
        return generateExercisePlanWithGemini(age, complaints, activityLevel);
    }
     if (activeProvider === 'custom') {
        const schemaString = JSON.stringify(exercisePlanSchema.properties, null, 2).replace(/"/g, "'");
        const prompt = `
            Generate a 4-week physiotherapy exercise plan for a person with the following details:
            - Age: ${age}
            - Health Complaints/Goals: ${complaints}
            - Current Activity Level: ${activityLevel}

            The plan should be safe, progressive, and tailored to these details. 
            The output must be a single, valid JSON object that strictly adheres to the following structure. Do not include any other text, markdown, or explanations outside of the JSON object.
            Schema:
            ${schemaString}
        `;
        return generateContentWithCustomProvider(prompt);
    }
    if (activeProvider === 'openai') {
        throwOpenAIError();
    }
    if (activeProvider === 'groq') {
        throwGroqError();
    }
    throw new Error("AI Service not configured. Please select a provider and set your API Key in settings.");
};

export const analyzePosture = async (base64ImageData: string, mimeType: string): Promise<PostureAnalysisResult> => {
    if (activeProvider === 'gemini') {
        return analyzePostureWithGemini(base64ImageData, mimeType);
    }
    if (activeProvider === 'custom') {
        const schemaString = JSON.stringify(postureAnalysisSchema.properties, null, 2).replace(/"/g, "'");
        const prompt = `
            Analyze the posture of the person in this image. 
            Identify key postural deviations from a side-view perspective.
            Assess the overall risk level as Low, Medium, or High.
            Provide actionable recommendations, including specific exercises, to help correct these deviations.
            The output must be a single, valid JSON object that strictly adheres to the following structure. Do not include any other text, markdown, or explanations outside of the JSON object.
            Schema:
            ${schemaString}
        `;
        return generateContentWithCustomProvider(prompt, base64ImageData, mimeType);
    }
    if (activeProvider === 'openai') {
        throwOpenAIError();
    }
    if (activeProvider === 'groq') {
        throwGroqError();
    }
    throw new Error("AI Service not configured. Please select a provider and set your API Key in settings.");
};