import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Lightbulb,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { IntegratedInsight, ActiveTab } from '../types.ts';

interface JournalTabProps {
  integratedInsights: IntegratedInsight[];
  setActiveWizard: (wizardName: string | null, linkedInsightId?: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setHighlightPracticeId: (practiceId: string | null) => void;
}

export default function JournalTab({ integratedInsights, setActiveWizard, setActiveTab, setHighlightPracticeId }: JournalTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'addressed'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  const handleStartPractice = (insightId: string, practiceId: string) => {
    let wizardName: string | null = null;

    // Map practiceId to wizard name (if available)
    switch (practiceId) {
        // Shadow Tools
        case 'three-two-one':
            wizardName = '321';
            break;
        case 'parts-dialogue':
            wizardName = 'ifs';
            break;
        case 'relational-pattern':
            wizardName = 'relational';
            break;
        case 'big-mind':
            wizardName = 'bigmind';
            break;
        case 'memory-reconsolidation':
            wizardName = 'memory-reconsolidation';
            break;
        // Mind Tools
        case 'bias-detective':
            wizardName = 'bias';
            break;
        case 'subject-object':
            wizardName = 'so';
            break;
        case 'perspective-shifter':
            wizardName = 'ps';
            break;
        case 'polarity-mapper':
            wizardName = 'pm';
            break;
        case 'kegan-assessment':
            wizardName = 'kegan';
            break;
        case 'role-alignment':
            wizardName = 'role-alignment';
            break;
        // Body Tools
        case 'somatic-generator':
            wizardName = 'somatic';
            break;
        case 'attachment-assessment':
            wizardName = 'attachment';
            break;
        case 'integral-body-architect':
            wizardName = 'integral-body';
            break;
        case 'workout-architect':
            wizardName = 'workout';
            break;
        // Spirit Tools
        case 'jhana-tracker':
            wizardName = 'jhana';
            break;
        case 'meditation-finder':
            wizardName = 'meditation';
            break;
        case 'consciousness-graph':
            wizardName = 'consciousness-graph';
            break;
        case 'eight-zones':
            wizardName = 'eight-zones';
            break;
        default:
            // Practice doesn't have a wizard - open Browse tab with this practice highlighted
            setHighlightPracticeId(practiceId);
            setActiveTab('browse');
            return;
    }

    // If we found a wizard, launch it with insight context
    setActiveWizard(wizardName, insightId);
  };

  // Get unique wizard types for filter
  const wizardTypes = useMemo(() => {
    const types = new Set(integratedInsights.map(i => i.mindToolType));
    return ['all', ...Array.from(types).sort()];
  }, [integratedInsights]);

  // Filter and sort insights
  const filteredInsights = useMemo(() => {
    let filtered = [...integratedInsights];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(i => i.status === filterStatus);
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(i => i.mindToolType === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        i.detectedPattern.toLowerCase().includes(query) ||
        i.mindToolName.toLowerCase().includes(query) ||
        i.mindToolShortSummary.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());

    return filtered;
  }, [integratedInsights, filterStatus, filterType, searchQuery]);

  // Group insights by date
  const groupedInsights = useMemo(() => {
    const groups: { [key: string]: IntegratedInsight[] } = {};

    filteredInsights.forEach(insight => {
      const date = new Date(insight.dateCreated).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(insight);
    });

    return groups;
  }, [filteredInsights]);

  const toggleExpanded = (insightId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  const getToolCategory = (toolType: string): { name: string; color: string } => {
    const mindTools = ['Bias Detective', 'Bias Finder', 'Subject-Object Explorer', 'Perspective-Shifter', 'Polarity Mapper', 'Kegan Assessment', 'Role Alignment'];
    const shadowTools = ['3-2-1 Reflection', 'IFS Session', 'Relational Pattern', 'Big Mind Process', 'Memory Reconsolidation'];
    const bodyTools = ['Somatic Practice', 'Attachment Assessment', 'Integral Body Plan', 'Workout Program'];
    const spiritTools = ['Jhana Guide', 'Meditation Finder', 'Consciousness Graph', 'Eight Zones'];

    if (mindTools.includes(toolType)) return { name: 'Mind', color: 'text-blue-400 bg-blue-900/30 border-blue-700/50' };
    if (shadowTools.includes(toolType)) return { name: 'Shadow', color: 'text-amber-400 bg-amber-900/30 border-amber-700/50' };
    if (bodyTools.includes(toolType)) return { name: 'Body', color: 'text-teal-400 bg-teal-900/30 border-teal-700/50' };
    if (spiritTools.includes(toolType)) return { name: 'Spirit', color: 'text-purple-400 bg-purple-900/30 border-purple-700/50' };
    return { name: 'Other', color: 'text-slate-400 bg-slate-800/30 border-slate-700/50' };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={32} className="text-accent" />
          <h1 className="text-4xl font-bold font-mono text-slate-100">Insight Journal</h1>
        </div>
        <p className="text-slate-400">
          A comprehensive record of all patterns detected and insights generated from your practice sessions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-glass bg-gradient-to-br from-slate-800/70 to-slate-900/50 border border-accent/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-accent">{integratedInsights.length}</div>
          <div className="text-xs text-slate-400 mt-1">Total Insights</div>
        </div>
        <div className="card-glass bg-gradient-to-br from-amber-900/50 to-orange-900/25 border border-amber-500/40 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-amber-300">
            {integratedInsights.filter(i => i.status === 'pending').length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Pending</div>
        </div>
        <div className="card-glass bg-gradient-to-br from-green-900/50 to-emerald-900/25 border border-green-500/40 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-300">
            {integratedInsights.filter(i => i.status === 'addressed').length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Addressed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patterns, insights, or session names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-3 flex-wrap">
          {/* Status filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                filterStatus === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'
              }`}
            >
              <Clock size={14} />
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('addressed')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                filterStatus === 'addressed'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'
              }`}
            >
              <CheckCircle size={14} />
              Addressed
            </button>
          </div>

          {/* Type filter dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-accent/50 transition-colors"
          >
            {wizardTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Tools' : type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-slate-400">
        Showing {filteredInsights.length} of {integratedInsights.length} insights
      </div>

      {/* Insights grouped by date */}
      {filteredInsights.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No insights found</p>
          <p className="text-slate-500 text-sm mt-2">
            {integratedInsights.length === 0
              ? 'Complete wizard sessions to generate insights'
              : 'Try adjusting your filters or search query'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedInsights).map(([date, insights]) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <Calendar size={18} className="text-accent" />
                <h2 className="text-xl font-semibold text-slate-200">{date}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-accent/30 to-transparent"></div>
              </div>

              {/* Insights for this date */}
              <div className="space-y-3">
                {insights.map(insight => {
                  const category = getToolCategory(insight.mindToolType);
                  const isExpanded = expandedInsights.has(insight.id);

                  return (
                    <div
                      key={insight.id}
                      className="card-glass bg-gradient-to-br from-slate-800/70 to-slate-900/50 border border-slate-700/50 rounded-xl p-5 hover:border-accent/30 transition-all duration-300"
                    >
                      {/* Header - always visible */}
                      <div
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => toggleExpanded(insight.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${category.color}`}>
                              {category.name}
                            </span>
                            <span className="text-xs text-slate-500">{insight.mindToolType}</span>
                            {insight.status === 'pending' ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                Pending
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/40 flex items-center gap-1">
                                <CheckCircle size={12} /> Addressed
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-slate-100 mb-1">
                            {insight.mindToolName}
                          </h3>
                          <p className="text-sm text-slate-400">{insight.mindToolShortSummary}</p>
                        </div>
                        <button className="ml-4 text-slate-400 hover:text-accent transition-colors">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4">
                          {/* Detected Pattern */}
                          <div className="bg-slate-900/60 border border-slate-700/60 rounded-lg p-4">
                            <p className="font-semibold text-slate-300 flex items-center gap-2 mb-2">
                              <BrainCircuit size={16} className="text-accent" />
                              Detected Pattern
                            </p>
                            <p className="text-sm text-slate-200">{insight.detectedPattern}</p>
                          </div>

                          {/* Suggested Shadow Work */}
                          {insight.suggestedShadowWork && insight.suggestedShadowWork.length > 0 && (
                            <div>
                              <p className="font-semibold text-slate-300 mb-2 text-sm">
                                Suggested Shadow Work
                              </p>
                              <div className="space-y-2">
                                {insight.suggestedShadowWork.map((sw, idx) => (
                                  <div key={idx} className="bg-slate-700/40 rounded-lg p-3 border border-slate-600/30 flex justify-between items-center">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-slate-200">{sw.practiceName}</p>
                                      <p className="text-xs text-slate-400 mt-1">{sw.rationale}</p>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartPractice(insight.id, sw.practiceId);
                                      }}
                                      className="ml-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-300 flex items-center gap-1 shadow-md hover:shadow-lg transform hover:scale-105"
                                      style={{boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'}}
                                    >
                                      <Sparkles size={14} /> Start
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Suggested Next Steps */}
                          {insight.suggestedNextSteps && insight.suggestedNextSteps.length > 0 && (
                            <div>
                              <p className="font-semibold text-slate-300 mb-2 text-sm">
                                Suggested Next Steps
                              </p>
                              <div className="space-y-2">
                                {insight.suggestedNextSteps.map((step, idx) => (
                                  <div key={idx} className="bg-slate-700/40 rounded-lg p-3 border border-slate-600/30 flex justify-between items-center">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-slate-200">{step.practiceName}</p>
                                      <p className="text-xs text-slate-400 mt-1">{step.rationale}</p>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartPractice(insight.id, step.practiceId);
                                      }}
                                      className="ml-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-300 flex items-center gap-1 shadow-md hover:shadow-lg transform hover:scale-105"
                                      style={{boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'}}
                                    >
                                      <Sparkles size={14} /> Start
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Full Report - collapsible text */}
                          {insight.mindToolReport && (
                            <div>
                              <p className="font-semibold text-slate-300 mb-2 text-sm">Session Report</p>
                              <div className="bg-slate-900/60 border border-slate-700/60 rounded-lg p-4 max-h-96 overflow-y-auto">
                                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans">
                                  {insight.mindToolReport}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
