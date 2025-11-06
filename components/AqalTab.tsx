
import React from 'react';
// FIX: Add file extension to import path.
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
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-mono text-slate-100 tracking-tighter">AQAL Report</h1>
        <p className="text-slate-400 mt-2">Get a holistic, AI-powered analysis of your practice across all four quadrants of your being.</p>
      </header>

      <section className="bg-slate-800/50 border border-slate-700/80 rounded-lg p-6 text-center">
        <Target size={32} className="mx-auto text-accent mb-4" />
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Generate Your Integral Analysis</h2>
        <p className="text-slate-400 my-3 max-w-2xl mx-auto">Aura will review your current practice stack, completion data, and notes to provide insights on your development in the "I", "We", "It", and "Its" quadrants.</p>
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
            <h2 className="text-3xl font-bold tracking-tight text-slate-100 mb-3">Overall Summary</h2>
            <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-5 card-luminous-hover">
              <p className="text-slate-300 leading-relaxed">{report.summary}</p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-100 mb-3">Quadrant Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-5 card-luminous-hover">
                <h3 className="text-xl font-bold text-blue-300 mb-2">I (Subjective)</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{report.quadrantInsights.I}</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-5 card-luminous-hover">
                <h3 className="text-xl font-bold text-green-300 mb-2">It (Objective)</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{report.quadrantInsights.It}</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-5 card-luminous-hover">
                <h3 className="text-xl font-bold text-amber-300 mb-2">We (Intersubjective)</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{report.quadrantInsights.We}</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-5 card-luminous-hover">
                <h3 className="text-xl font-bold text-red-300 mb-2">Its (Interobjective)</h3>
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