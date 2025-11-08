

import React, { useState } from 'react';
import { Practice, ModuleKey, AllPractice } from '../types.ts';
import { practices, modules } from '../constants.ts';
import { Check, Plus, Search } from 'lucide-react';
import PracticeInfoModal from './PracticeInfoModal.tsx';
import { SectionDivider } from './SectionDivider.tsx';

interface BrowseTabProps {
  practiceStack: AllPractice[];
  addToStack: (practice: Practice) => void;
  // FIX: Add onExplainClick and onPersonalizeClick to the component's props to resolve the TypeScript error in App.tsx.
  onExplainClick: (practice: Practice) => void;
  onPersonalizeClick: (practice: Practice) => void;
}

export default function BrowseTab({ practiceStack, addToStack, onExplainClick, onPersonalizeClick }: BrowseTabProps) {
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const stackIds = new Set(practiceStack.map(p => p.id));

  const filteredPractices = Object.entries(practices).reduce((acc, [moduleKey, modulePractices]) => {
    const filtered = modulePractices.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[moduleKey as ModuleKey] = filtered;
    }
    return acc;
  }, {} as typeof practices);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">Browse Practices</h1>
        <p className="text-slate-400 mt-2">Explore the core practices of the Integral Life Practice system. Click on any practice to learn more and add it to your stack.</p>
        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Search practices..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-md bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </header>
      
      <SectionDivider />

      <img
        src="https://files.catbox.moe/l82wnf.avif"
        alt="Browse Practices"
        className="w-full rounded-lg"
      />

      <SectionDivider />

      <div className="space-y-10">
        {Object.keys(filteredPractices).length === 0 && (
          <p className="text-slate-500 text-center py-10">No practices found for "{searchTerm}".</p>
        )}
        {(Object.entries(filteredPractices) as [ModuleKey, Practice[]][]).map(([moduleKey, modulePractices]) => (
          <div key={moduleKey}>
            <h2 className={`text-3xl font-bold tracking-tight mb-4 ${modules[moduleKey].textColor}`}>
              {modules[moduleKey].name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modulePractices.map(practice => {
                const isInStack = stackIds.has(practice.id);
                return (
                  <div key={practice.id} className={`card-luminous-hover bg-slate-800/50 border border-slate-800 border-l-4 ${modules[moduleKey].borderColor} rounded-r-lg p-4 flex flex-col justify-between cursor-pointer`} onClick={() => setSelectedPractice(practice)}>
                    <div>
                      <h3 className="font-bold font-mono text-slate-200">{practice.name}</h3>
                      <p className="text-sm text-slate-400 mt-1">{practice.description}</p>
                    </div>
                    <div className="mt-3 text-right">
                      {isInStack ? (
                        <span className="text-xs font-bold text-green-400 flex items-center justify-end gap-1"><Check size={14}/> In Stack</span>
                      ) : (
                        <span className="text-xs font-bold text-blue-400 flex items-center justify-end gap-1"><Plus size={14}/> Add to Stack</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <PracticeInfoModal
        practice={selectedPractice}
        onClose={() => setSelectedPractice(null)}
        onAdd={(p) => {
          addToStack(p);
          setSelectedPractice(null);
        }}
        isInStack={!!selectedPractice && stackIds.has(selectedPractice.id)}
        onExplainClick={onExplainClick}
        onPersonalizeClick={onPersonalizeClick}
      />
    </div>
  );
}