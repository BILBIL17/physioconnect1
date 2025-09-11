
import React from 'react';

interface WelcomePageProps {
  onNavigateToLogin: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onNavigateToLogin }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#00838f] to-[#00c4cc] p-4">
      <div className="text-center bg-white/20 backdrop-blur-lg p-10 rounded-2xl shadow-2xl border border-white/30">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-3">
          Physcio Connect
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-8">
          Your AI-powered physiotherapy assistant
        </p>
        <button
          onClick={onNavigateToLogin}
          className="bg-[#00bfa5] text-white font-bold py-3 px-10 rounded-full text-lg shadow-lg hover:bg-[#00a794] transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#00c4cc]/50"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;
