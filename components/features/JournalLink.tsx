
import React, { useState, useMemo } from 'react';
import type { Journal } from '../../types';

const journalData: Journal[] = [
    { id: 1, title: 'Journal of Orthopaedic & Sports Physical Therapy (JOSPT)', publisher: 'JOSPT', year: 1979, link: 'https://www.jospt.org/' },
    { id: 2, title: 'Physical Therapy Journal (PTJ)', publisher: 'Oxford University Press', year: 1921, link: 'https://academic.oup.com/ptj' },
    { id: 3, title: 'PubMed', publisher: 'National Library of Medicine (NLM)', year: 1996, link: 'https://pubmed.ncbi.nlm.nih.gov/' },
    { id: 4, title: 'The Lancet', publisher: 'Elsevier', year: 1823, link: 'https://www.thelancet.com/' },
    { id: 5, title: 'ResearchGate', publisher: 'ResearchGate GmbH', year: 2008, link: 'https://www.researchgate.net/' },
    { id: 6, title: 'British Journal of Sports Medicine (BJSM)', publisher: 'BMJ', year: 1964, link: 'https://bjsm.bmj.com/' },
    { id: 7, title: 'Archives of Physical Medicine and Rehabilitation', publisher: 'Elsevier', year: 1920, link: 'https://www.archives-pmr.org/' },
];

const JournalLink: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredJournals = useMemo(() => {
        return journalData.filter(journal =>
            journal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            journal.publisher.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    return (
        <div>
            <h2 className="text-2xl font-bold text-[#37474f] mb-4">Trusted Journal Links</h2>
            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Search journals by title or publisher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-10 rounded-lg border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#00838f]"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>

            <div className="space-y-4">
                {filteredJournals.map(journal => (
                    <div key={journal.id} className="bg-white p-4 rounded-lg shadow-sm border border-[#e0e0e0] flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-[#00838f]">{journal.title}</h3>
                            <p className="text-sm text-[#78909c]">{journal.publisher} - Since {journal.year}</p>
                        </div>
                        <a 
                            href={journal.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-[#00bfa5] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#00a794] transition-colors text-sm whitespace-nowrap"
                        >
                            Visit Site <i className="fas fa-external-link-alt ml-1"></i>
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JournalLink;
