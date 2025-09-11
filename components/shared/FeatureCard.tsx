
import React from 'react';

interface FeatureCardProps {
    title: string;
    icon: string;
    isActive: boolean;
    onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, icon, isActive, onClick }) => {
    const baseClasses = "flex flex-col items-center justify-center text-center p-4 rounded-xl shadow-md cursor-pointer transition-all duration-300 transform";
    const activeClasses = "bg-[#00838f] text-white scale-105 shadow-lg";
    const inactiveClasses = "bg-white text-[#37474f] hover:bg-gray-50 hover:scale-105";

    return (
        <div className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`} onClick={onClick}>
            <i className={`fas ${icon} text-3xl mb-2`}></i>
            <h3 className="font-semibold text-sm">{title}</h3>
        </div>
    );
}

export default FeatureCard;
