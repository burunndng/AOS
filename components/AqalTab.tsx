import React from 'react';
import { AqalReportData } from '../types.ts';
import { Target, Sparkles, CheckCircle } from 'lucide-react';

interface AqalTabProps {
  report: AqalReportData | null;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

export default function AqalTab({ report, isLoading, error, onGenerate }: AqalTabProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono text-slate-100 tracking-tighter">AQAL Report</h1>
        <p className="text-sm sm:text-base text-slate-400 mt-2">Get a holistic, AI-powered analysis of your practice across all four quadrants of your being.</p>
      </header>

      <section className="bg-slate-800/50 border border-slate-700/80 rounded-lg p-6 text-center">
        <Target size={32} className="mx-auto text-accent mb-4" />
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Generate Your Integral Analysis</h2>
        <p className="text-slate-400 my-3 max-w-2xl mx-auto">Aura will review your current practice stack, completion data, and notes to provide insights on your development in the "I", "We", "It", and "Its" quadrants.</p>
        
        {/* NEW: AQAL Quadrants Image */}
        <div className="my-6 max-w-4xl mx-auto">
          <img 
            src="https://integraleuropeanconference.com/wp-content/uploads/2019/07/FourQuadrants-Humans.jpg" 
            alt="AQAL Quadrants Diagram" 
            className="w-full rounded-lg shadow-md border border-slate-700"
          />
          <p className="text-xs text-slate-500 mt-2 italic">The AQAL (All Quadrants All Levels) Framework by Ken Wilber</p>
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="btn-luminous font-bold py-2 px-5 rounded-lg flex items-center gap-2 transition disabled:cursor-not-allowed mx-auto"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating Report...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Generate Report
            </>
          )}
        </button>
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </section>

      {report && (
        <section className="space-y-6 animate-fade-in">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-3xl font-bold tracking-tight text-slate-100">Overall Summary</h2>
              {report.generatedAt && (
                <span className="text-xs text-slate-500">
                  Generated {new Date(report.generatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-5 card-luminous-hover">
              <p className="text-slate-300 leading-relaxed">{report.summary}</p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-100 mb-3">Quadrant Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`bg-slate-800/50 border ${report.quadrantScores && report.quadrantScores.I <= 2 ? 'border-orange-500/50' : 'border-slate-800'} rounded-lg p-5 card-luminous-hover`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-blue-300">I (Subjective)</h3>
                  {report.quadrantScores && (
                    <span className={`text-xs ${report.quadrantScores.I <= 2 ? 'text-orange-400 font-semibold' : 'text-slate-400'}`}>
                      {report.quadrantScores.I}/10 {report.quadrantScores.I <= 2 && '⚠️'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 italic mb-2">Interior-Individual: thoughts, feelings, consciousness</p>
                {report.quadrantScores && (
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                    <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${report.quadrantScores.I * 10}%` }}></div>
                  </div>
                )}
                <p className="text-slate-300 text-sm leading-relaxed">{report.quadrantInsights.I}</p>
              </div>
              <div className={`bg-slate-800/50 border ${report.quadrantScores && report.quadrantScores.It <= 2 ? 'border-orange-500/50' : 'border-slate-800'} rounded-lg p-5 card-luminous-hover`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-green-300">It (Objective)</h3>
                  {report.quadrantScores && (
                    <span className={`text-xs ${report.quadrantScores.It <= 2 ? 'text-orange-400 font-semibold' : 'text-slate-400'}`}>
                      {report.quadrantScores.It}/10 {report.quadrantScores.It <= 2 && '⚠️'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 italic mb-2">Exterior-Individual: body, behaviors, physiology</p>
                {report.quadrantScores && (
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                    <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${report.quadrantScores.It * 10}%` }}></div>
                  </div>
                )}
                <p className="text-slate-300 text-sm leading-relaxed">{report.quadrantInsights.It}</p>
              </div>
              <div className={`bg-slate-800/50 border ${report.quadrantScores && report.quadrantScores.We <= 2 ? 'border-orange-500/50' : 'border-slate-800'} rounded-lg p-5 card-luminous-hover`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-amber-300">We (Intersubjective)</h3>
                  {report.quadrantScores && (
                    <span className={`text-xs ${report.quadrantScores.We <= 2 ? 'text-orange-400 font-semibold' : 'text-slate-400'}`}>
                      {report.quadrantScores.We}/10 {report.quadrantScores.We <= 2 && '⚠️'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 italic mb-2">Interior-Collective: culture, relationships, shared meaning</p>
                {report.quadrantScores && (
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                    <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${report.quadrantScores.We * 10}%` }}></div>
                  </div>
                )}
                <p className="text-slate-300 text-sm leading-relaxed">{report.quadrantInsights.We}</p>
              </div>
              <div className={`bg-slate-800/50 border ${report.quadrantScores && report.quadrantScores.Its <= 2 ? 'border-orange-500/50' : 'border-slate-800'} rounded-lg p-5 card-luminous-hover`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-red-300">Its (Interobjective)</h3>
                  {report.quadrantScores && (
                    <span className={`text-xs ${report.quadrantScores.Its <= 2 ? 'text-orange-400 font-semibold' : 'text-slate-400'}`}>
                      {report.quadrantScores.Its}/10 {report.quadrantScores.Its <= 2 && '⚠️'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 italic mb-2">Exterior-Collective: systems, environments, structures</p>
                {report.quadrantScores && (
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                    <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${report.quadrantScores.Its * 10}%` }}></div>
                  </div>
                )}
                <p className="text-slate-300 text-sm leading-relaxed">{report.quadrantInsights.Its}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-100 mb-3">Recommendations</h2>
            <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-5 card-luminous-hover">
              <ul className="space-y-3">
                {report.recommendations.map((rec, index) => (
                  <li key={index} className="text-slate-300 flex items-start gap-3">
                    <CheckCircle size={18} className="text-green-500 mt-1 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}