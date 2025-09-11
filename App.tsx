import React, { useState, useEffect } from 'react';
import WelcomePage from './components/WelcomePage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { initializeAi } from './services/geminiService';

type View = 'welcome' | 'login' | 'dashboard';
export type AiProvider = 'gemini' | 'openai' | 'groq' | 'custom';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('welcome');
  const [aiProvider, setAiProvider] = useState<AiProvider>(() => (localStorage.getItem('ai_provider') as AiProvider) || 'gemini');
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [openAiApiKey, setOpenAiApiKey] = useState<string>(() => localStorage.getItem('openai_api_key') || '');
  const [groqApiKey, setGroqApiKey] = useState<string>(() => localStorage.getItem('groq_api_key') || '');
  const [customApiBaseUrl, setCustomApiBaseUrl] = useState<string>(() => localStorage.getItem('custom_api_base_url') || '');
  const [customApiModel, setCustomApiModel] = useState<string>(() => localStorage.getItem('custom_api_model') || '');
  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem('custom_api_key') || '');


  useEffect(() => {
    let activeProviderKey = '';
    let activeBaseUrl: string | undefined = undefined;
    let activeModel: string | undefined = undefined;

    switch (aiProvider) {
        case 'gemini':
            activeProviderKey = geminiApiKey;
            break;
        case 'openai':
            activeProviderKey = openAiApiKey;
            break;
        case 'groq':
            activeProviderKey = groqApiKey;
            break;
        case 'custom':
            activeProviderKey = customApiKey;
            activeBaseUrl = customApiBaseUrl;
            activeModel = customApiModel;
            break;
    }

    // Prioritaskan inisialisasi dengan penyedia yang dipilih pengguna jika kunci ada untuknya.
    if (activeProviderKey) {
        initializeAi(aiProvider, activeProviderKey, activeBaseUrl, activeModel);
    } 
    // Sebagai fallback, jika penyedia yang dipilih tidak memiliki kunci tetapi kunci Gemini tersedia,
    // default ke penggunaan penyedia Gemini. Ini membuat aplikasi lebih tangguh.
    else if (geminiApiKey) {
        initializeAi('gemini', geminiApiKey);
        // Juga perbarui state untuk mencerminkan bahwa kita telah kembali ke Gemini
        if (aiProvider !== 'gemini') {
            setAiProvider('gemini');
            localStorage.setItem('ai_provider', 'gemini');
        }
    } 
    // Jika tidak ada kunci yang tersedia sama sekali, pastikan layanan tidak diinisialisasi.
    else {
        initializeAi('gemini', ''); // Melewatkan kunci kosong akan membatalkan inisialisasi layanan.
    }
  }, [aiProvider, geminiApiKey, openAiApiKey, groqApiKey, customApiKey, customApiBaseUrl, customApiModel]);

  const handleAiSettingsSave = (provider: AiProvider, geminiKey: string, openAiKey: string, groqKey: string, customKey: string, customBaseUrl: string, customModel: string) => {
    localStorage.setItem('ai_provider', provider);
    setAiProvider(provider);
    
    localStorage.setItem('gemini_api_key', geminiKey);
    setGeminiApiKey(geminiKey);

    localStorage.setItem('openai_api_key', openAiKey);
    setOpenAiApiKey(openAiKey);

    localStorage.setItem('groq_api_key', groqKey);
    setGroqApiKey(groqKey);

    localStorage.setItem('custom_api_key', customKey);
    setCustomApiKey(customKey);

    localStorage.setItem('custom_api_base_url', customBaseUrl);
    setCustomApiBaseUrl(customBaseUrl);
    
    localStorage.setItem('custom_api_model', customModel);
    setCustomApiModel(customModel);

    // useEffect akan menangani reinisialisasi
  };

  const navigateToLogin = () => setCurrentView('login');
  const navigateToDashboard = () => setCurrentView('dashboard');
  const navigateToWelcome = () => setCurrentView('welcome');

  const renderView = () => {
    switch (currentView) {
      case 'welcome':
        return <WelcomePage onNavigateToLogin={navigateToLogin} />;
      case 'login':
        return <LoginPage onLoginSuccess={navigateToDashboard} />;
      case 'dashboard':
        return <Dashboard 
                  onLogout={navigateToWelcome}
                  aiProvider={aiProvider}
                  geminiApiKey={geminiApiKey}
                  openAiApiKey={openAiApiKey}
                  groqApiKey={groqApiKey}
                  customApiKey={customApiKey}
                  customApiBaseUrl={customApiBaseUrl}
                  customApiModel={customApiModel}
                  onAiSettingsSave={handleAiSettingsSave} 
                />;
      default:
        return <WelcomePage onNavigateToLogin={navigateToLogin} />;
    }
  };

  return <div className="min-h-screen bg-[#f4f7f6] text-[#37474f] font-sans">{renderView()}</div>;
};

export default App;