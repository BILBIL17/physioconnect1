
import React from 'react';

const FooterDisclaimer: React.FC = () => {
    return (
        <div className="mt-8 p-4 bg-orange-100 border-l-4 border-[#ff9800] text-[#37474f] rounded-r-lg">
            <p className="font-semibold">
                <i className="fas fa-exclamation-triangle mr-2 text-[#ff9800]"></i>
                Disclaimer
            </p>
            <p className="text-sm">
                This tool is for assistance only. Consult a professional physiotherapist if pain persists or worsens.
            </p>
        </div>
    );
}

export default FooterDisclaimer;
