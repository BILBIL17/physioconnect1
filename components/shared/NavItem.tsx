import React from 'react';

interface NavItemProps {
    label: string;
    icon: string;
    isActive: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, isActive, onClick }) => {
    const activeClasses = "text-[#00838f]";
    const inactiveClasses = "text-gray-500 hover:text-[#00838f]";

    return (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-20 transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
            aria-current={isActive ? 'page' : undefined}
        >
            <i className={`fas ${icon} text-2xl mb-1`}></i>
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
};

export default NavItem;
