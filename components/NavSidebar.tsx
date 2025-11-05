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
    Hand, // NEW: Import Hand icon
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
    { id: 'body-tools', label: 'Body Tools', icon: Hand, group: 'Toolkits' }, // NEW: Body Tools tab
    { id: 'library', label: 'Library', icon: Library, group: 'Resources' },
];

const NavButton = ({ item, isActive, onClick }: { item: any, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
            isActive
                ? 'bg-accent/10 text-accent font-semibold shadow-[0_0_15px_rgba(217,170,239,0.2)]'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
    >
        <item.icon size={18} />
        <span>{item.label}</span>
    </button>
);


export default function NavSidebar({ activeTab, setActiveTab, onExport, onImport, onReset }: NavSidebarProps) {
    let lastGroup: string | undefined = undefined;

    return (
        <aside className="w-64 bg-slate-900/50 border-r border-slate-800/70 p-4 flex flex-col sticky top-0 h-screen">
            <div className="flex items-center gap-3 px-2 flex-shrink-0">
                {/* FIX: MerkabaIcon now accepts 'size' prop for explicit sizing. */}
                <MerkabaIcon className="text-accent" size={28} />
                <h1 className="text-2xl font-bold font-mono tracking-tighter text-slate-100">Aura OS</h1>
            </div>
            <nav className="flex flex-col gap-1 mt-6 flex-grow overflow-y-auto pr-2 -mr-2">
                {navItems.map(item => {
                    const isGroupStart = item.group && item.group !== lastGroup;
                    lastGroup = item.group;
                    return (
                        <React.Fragment key={item.id}>
                            {isGroupStart && (
                                <h2 className="font-mono text-xs font-semibold text-slate-500 uppercase mt-4 mb-2 px-3 tracking-wider">
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
            <div className="flex-shrink-0 mt-4">
                 <h2 className="font-mono text-xs font-semibold text-slate-500 uppercase mt-4 mb-2 px-3 tracking-wider">
                    App Settings
                </h2>
                <div className="space-y-1">
                    <button onClick={onExport} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
                        <Download size={18} />
                        <span>Export Data</span>
                    </button>
                    <button onClick={onImport} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
                        <Upload size={18} />
                        <span>Import Data</span>
                    </button>
                     <button onClick={onReset} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors">
                        <Trash2 size={18} />
                        <span>Reset App</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}