
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
    Map,
} from 'lucide-react';
import { MerkabaIcon } from './MerkabaIcon.tsx';

interface NavSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  onSummonFlabbergaster: () => void;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'stack', label: 'My Stack', icon: LayoutDashboard, group: 'Practice' },
    { id: 'browse', label: 'Browse Practices', icon: Search },
    { id: 'tracker', label: 'Daily Tracker', icon: CheckSquare },
    { id: 'streaks', label: 'Streaks', icon: Zap },
    { id: 'recommendations', label: 'Recommendations', icon: Sparkles, group: 'Insights' },
    { id: 'aqal', label: 'AQAL Report', icon: BookOpen },
    { id: 'quiz', label: 'ILP Graph Quiz', icon: HelpCircle, group: 'Learning' },
    { id: 'journey', label: 'The Journey', icon: Map, group: 'Learning' },
    { id: 'mind-tools', label: 'Mind Tools', icon: BrainCircuit, group: 'Toolkits' },
    { id: 'shadow-tools', label: 'Shadow Tools', icon: Shield },
    { id: 'body-tools', label: 'Body Tools', icon: Hand },
    { id: 'spirit-tools', label: 'Spirit Tools', icon: Flame },
    { id: 'library', label: 'Library', icon: Library, group: 'Resources' },
];

const NavButton = ({ item, isActive, onClick }: { item: any, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
            isActive
                ? 'bg-gradient-to-r from-accent/20 to-accent/8 text-accent font-semibold border border-accent/40 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border hover:border-accent/30 hover:shadow-md'
        }`}
        style={isActive ? {
          boxShadow: '0 8px 32px rgba(217, 170, 239, 0.2), 0 0 20px rgba(217, 170, 239, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)'
        } : {
          boxShadow: isActive ? '' : '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.05)'
        }}
    >
        <item.icon size={18} className="group-hover:scale-110 transition-transform duration-300" />
        <span>{item.label}</span>
        {/* Shine effect on hover */}
        {!isActive && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700" />}
    </button>
);


export default function NavSidebar({ activeTab, setActiveTab, onExport, onImport, onReset, onSummonFlabbergaster }: NavSidebarProps) {
    let lastGroup: string | undefined = undefined;
    const [clickCount, setClickCount] = React.useState(0);
    const clickTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleSparkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newCount = clickCount + 1;
        setClickCount(newCount);
        console.log(`✦ Flabbergaster spark clicked: ${newCount}/3`);

        // Reset click count if threshold time exceeded
        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
        }

        if (newCount === 3) {
            // Triple-click detected
            console.log('🌑 FLABBERGASTER SUMMONED!');
            onSummonFlabbergaster();
            setClickCount(0);
        } else {
            // Set timer to reset count after 1.5 seconds
            clickTimerRef.current = setTimeout(() => {
                setClickCount(0);
            }, 1500);
        }
    };

    React.useEffect(() => {
        return () => {
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
            }
        };
    }, []);

    return (
        <aside className="w-64 p-4 flex flex-col sticky top-0 h-screen" style={{background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(26, 40, 71, 0.75) 50%, rgba(15, 23, 42, 0.85) 100%)', backdropFilter: 'blur(16px)', borderRight: '1px solid rgba(217, 170, 239, 0.15)', boxShadow: '8px 0 40px rgba(0, 0, 0, 0.4), -2px 0 16px rgba(217, 170, 239, 0.08), inset -1px 0 2px rgba(217, 170, 239, 0.2)'}}>
            <div className="flex items-center gap-3 px-2 flex-shrink-0 group cursor-pointer relative">
                {/* FIX: MerkabaIcon now accepts 'size' prop for explicit sizing. */}
                <div className="relative">
                    <MerkabaIcon className="text-accent group-hover:animate-spin drop-shadow-lg" size={28} style={{transition: 'all 0.3s ease'}} />
                    {/* Flabbergaster Spark Trigger - Visible easter egg (will be made subtle after testing) */}
                    <button
                        onClick={handleSparkClick}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleSparkClick(e as any);
                            }
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full opacity-90 hover:opacity-100 transition-all duration-200 animate-pulse cursor-pointer"
                        style={{
                            background: 'linear-gradient(135deg, rgb(217, 170, 239), rgb(255, 215, 0))',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                            boxShadow: '0 0 12px rgba(217, 170, 239, 1), 0 0 24px rgba(255, 215, 0, 0.6), inset 0 0 4px rgba(255, 255, 255, 0.5)',
                            border: '2px solid rgba(255, 255, 255, 0.4)'
                        }}
                        aria-label="Flabbergaster spark (triple-click to unlock)"
                        title="🗝️ Triple-click me!"
                    />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-mono tracking-tighter bg-gradient-to-r from-accent to-accent-gold bg-clip-text text-transparent drop-shadow-lg">Aura OS</h1>
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
                    <button onClick={onExport} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:border hover:border-accent/30 transition-all duration-300 group shadow-sm hover:shadow-md" style={{boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05)'}}>
                        <Download size={18} className="group-hover:scale-110 transition-transform duration-300" />
                        <span>Export Data</span>
                    </button>
                    <button onClick={onImport} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:border hover:border-accent/30 transition-all duration-300 group shadow-sm hover:shadow-md" style={{boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05)'}}>
                        <Upload size={18} className="group-hover:scale-110 transition-transform duration-300" />
                        <span>Import Data</span>
                    </button>
                     <button onClick={onReset} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/30 hover:border hover:border-red-500/40 transition-all duration-300 group shadow-sm hover:shadow-md" style={{boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05)'}}>
                        <Trash2 size={18} className="group-hover:scale-110 transition-transform duration-300" />
                        <span>Reset App</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}