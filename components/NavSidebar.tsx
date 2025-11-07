
import React from 'react';
// FIX: Correct import path for types.
import { ActiveTab } from '../types.ts';
import {
    Home,
    LayoutDashboard,
    CheckSquare,
    Zap,
    Sparkles,
    BrainCircuit,
    Shield,
    BookOpen,
    Search,
    Download,
    Upload,
    Trash2,
    Library,
    Hand,
    Flame,
    HelpCircle,
} from 'lucide-react';
import { MerkabaIcon } from './MerkabaIcon.tsx';

interface NavSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'stack', label: 'My Stack', icon: LayoutDashboard, group: 'Practice' },
    { id: 'browse', label: 'Browse Practices', icon: Search },
    { id: 'tracker', label: 'Daily Tracker', icon: CheckSquare },
    { id: 'streaks', label: 'Streaks', icon: Zap },
    { id: 'recommendations', label: 'Recommendations', icon: Sparkles, group: 'Insights' },
    { id: 'aqal', label: 'AQAL Report', icon: BookOpen },
    { id: 'mind-tools', label: 'Mind Tools', icon: BrainCircuit, group: 'Toolkits' },
    { id: 'shadow-tools', label: 'Shadow Tools', icon: Shield },
    { id: 'body-tools', label: 'Body Tools', icon: Hand },
    { id: 'spirit-tools', label: 'Spirit Tools', icon: Flame },
    { id: 'quiz', label: 'ILP Graph Quiz', icon: HelpCircle, group: 'Learning' },
    { id: 'library', label: 'Library', icon: Library, group: 'Resources' },
];

const NavButton = ({ item, isActive, onClick }: { item: any, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group ${
            isActive
                ? 'bg-gradient-to-r from-accent/15 to-accent/5 text-accent font-semibold shadow-[0_0_20px_rgba(217,170,239,0.25)] border border-accent/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:border hover:border-accent/20'
        }`}
        style={isActive ? { backdropFilter: 'blur(10px)' } : {}}
    >
        <item.icon size={18} className="group-hover:scale-110 transition-transform duration-300" />
        <span>{item.label}</span>
    </button>
);


export default function NavSidebar({ activeTab, setActiveTab, onExport, onImport, onReset }: NavSidebarProps) {
    let lastGroup: string | undefined = undefined;

    return (
        <aside className="w-64 p-4 flex flex-col sticky top-0 h-screen" style={{background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(26, 40, 71, 0.6) 100%)', backdropFilter: 'blur(10px)', borderRight: '1px solid rgba(217, 170, 239, 0.1)'}}>
            <div className="flex items-center gap-3 px-2 flex-shrink-0 group cursor-pointer">
                {/* FIX: MerkabaIcon now accepts 'size' prop for explicit sizing. */}
                <MerkabaIcon className="text-accent group-hover:animate-spin" size={28} style={{transition: 'all 0.3s ease'}} />
                <div>
                    <h1 className="text-2xl font-bold font-mono tracking-tighter bg-gradient-to-r from-accent to-accent-gold bg-clip-text text-transparent">Aura OS</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Integral Life Practice</p>
                </div>
            </div>
            <nav className="flex flex-col gap-1 mt-6 flex-grow overflow-y-auto pr-2 -mr-2">
                {navItems.map(item => {
                    const isGroupStart = item.group && item.group !== lastGroup;
                    lastGroup = item.group;
                    return (
                        <React.Fragment key={item.id}>
                            {isGroupStart && (
                                <div className="mt-4 mb-2">
                                    <h2 className="font-mono text-xs font-semibold text-slate-400 uppercase px-3 tracking-wider opacity-70">
                                        {item.group}
                                    </h2>
                                    <div className="h-px bg-gradient-to-r from-accent/20 to-transparent mt-2"></div>
                                </div>
                            )}
                            <NavButton
                                item={item}
                                isActive={activeTab === item.id}
                                onClick={() => setActiveTab(item.id as ActiveTab)}
                            />
                        </React.Fragment>
                    );
                })}
            </nav>
            {/* App Settings Section */}
            <div className="flex-shrink-0 mt-4 pt-4 border-t border-accent/20">
                 <h2 className="font-mono text-xs font-semibold text-slate-400 uppercase mt-4 mb-3 px-3 tracking-wider opacity-70">
                    App Settings
                </h2>
                <div className="space-y-1">
                    <button onClick={onExport} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 hover:border hover:border-accent/20 transition-all duration-300 group">
                        <Download size={18} className="group-hover:scale-110 transition-transform duration-300" />
                        <span>Export Data</span>
                    </button>
                    <button onClick={onImport} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 hover:border hover:border-accent/20 transition-all duration-300 group">
                        <Upload size={18} className="group-hover:scale-110 transition-transform duration-300" />
                        <span>Import Data</span>
                    </button>
                     <button onClick={onReset} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 hover:border hover:border-red-500/30 transition-all duration-300 group">
                        <Trash2 size={18} className="group-hover:scale-110 transition-transform duration-300" />
                        <span>Reset App</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}