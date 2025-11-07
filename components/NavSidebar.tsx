
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
    { id: 'library', label: 'Library', icon: Library, group: 'Resources' },
];

const NavButton = ({ item, isActive, onClick }: { item: any, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
            isActive
                ? 'bg-gradient-to-r from-purple-500/20 to-purple-400/10 text-purple-200 font-semibold shadow-[0_0_20px_rgba(168,85,247,0.25)] border border-purple-500/30'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 hover:border-purple-500/20 border border-transparent'
        }`}
    >
        <item.icon size={18} className="flex-shrink-0" />
        <span className="truncate">{item.label}</span>
    </button>
);


export default function NavSidebar({ activeTab, setActiveTab, onExport, onImport, onReset }: NavSidebarProps) {
    let lastGroup: string | undefined = undefined;

    return (
        <aside className="w-64 glass-effect border-r border-purple-500/20 p-5 flex flex-col sticky top-0 h-screen overflow-hidden">
            <div className="flex items-center gap-3 px-3 flex-shrink-0 mb-2">
                {/* FIX: MerkabaIcon now accepts 'size' prop for explicit sizing. */}
                <MerkabaIcon className="text-purple-300 animate-float" size={28} />
                <h1 className="text-xl font-bold font-mono tracking-tighter bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Aura OS</h1>
            </div>
            <div className="h-px subtle-divider mb-6"></div>
            <nav className="flex flex-col gap-2 flex-grow overflow-y-auto pr-3 -mr-3">
                {navItems.map(item => {
                    const isGroupStart = item.group && item.group !== lastGroup;
                    lastGroup = item.group;
                    return (
                        <React.Fragment key={item.id}>
                            {isGroupStart && (
                                <h2 className="font-mono text-xs font-semibold text-purple-400/70 uppercase mt-5 mb-3 px-4 tracking-widest opacity-80">
                                    {item.group}
                                </h2>
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
            <div className="flex-shrink-0 pt-4 border-t border-purple-500/15 mt-4">
                 <h2 className="font-mono text-xs font-semibold text-purple-400/70 uppercase mt-4 mb-3 px-4 tracking-widest opacity-80">
                    App Settings
                </h2>
                <div className="space-y-2">
                    <button onClick={onExport} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/40 hover:text-purple-200 transition-all duration-300 border border-transparent hover:border-purple-500/20">
                        <Download size={18} className="flex-shrink-0" />
                        <span className="truncate">Export Data</span>
                    </button>
                    <button onClick={onImport} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/40 hover:text-purple-200 transition-all duration-300 border border-transparent hover:border-purple-500/20">
                        <Upload size={18} className="flex-shrink-0" />
                        <span className="truncate">Import Data</span>
                    </button>
                     <button onClick={onReset} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 border border-transparent hover:border-red-500/20">
                        <Trash2 size={18} className="flex-shrink-0" />
                        <span className="truncate">Reset App</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}