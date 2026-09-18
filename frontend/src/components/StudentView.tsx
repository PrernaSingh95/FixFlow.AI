import React, { useState } from 'react';
import { 
  Send, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Tag, 
  Flame,
  ShieldAlert,
  Wind,
  Zap,
  Droplets,
  Monitor,
  Building2,
  AlertOctagon,
  Copy,
  BookOpen,
  Info,
  Check
} from 'lucide-react';

import { processComplaint } from '../api';
import type { ComplaintProcessResponse } from '../api';

interface StudentViewProps {
  onTicketCreated?: () => void;
}

const DEMO_SAMPLES = [
  {
    title: 'Duplicate AC Leak in Lab 3',
    text: 'AC leaking water in Lab 3, dripping onto desk.',
    tag: 'Duplicate Test',
    category: 'HVAC',
    icon: Wind,
    color: 'amber'
  },
  {
    title: 'Paraphrased Duplicate (Lab 3)',
    text: 'Water dripping from air conditioner in Laboratory 3, floor getting wet.',
    tag: 'Duplicate Test',
    category: 'HVAC',
    icon: Copy,
    color: 'amber'
  },
  {
    title: 'New IT Classroom Projector',
    text: 'Projector light out in Room 102, unable to display slides for lecture.',
    tag: 'New Ticket',
    category: 'IT',
    icon: Monitor,
    color: 'indigo'
  },
  {
    title: 'Critical Electrical Hazard',
    text: 'Wall electrical outlet near the microwave started smoking and sparking when plugged in.',
    tag: 'Critical Safety',
    category: 'Electrical',
    icon: Zap,
    color: 'rose'
  }
];

export const StudentView: React.FC<StudentViewProps> = ({ onTicketCreated }) => {
  const [complaintText, setComplaintText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ComplaintProcessResponse | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const handleAnalyze = async (autoCreate: boolean = false) => {
    if (!complaintText.trim() || complaintText.trim().length < 5) {
      setError('Please provide at least 5 characters describing the issue.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await processComplaint(complaintText, autoCreate);
      setAnalysis(res);
      if (res.created_ticket_id) {
        setCreatedTicketId(res.created_ticket_id);
        if (onTicketCreated) onTicketCreated();
      }
      if (res.is_duplicate && !autoCreate) {
        setShowDuplicateModal(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error processing complaint.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    setShowDuplicateModal(false);
    await handleAnalyze(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HVAC': return <Wind className="w-4 h-4 text-sky-600" />;
      case 'Electrical': return <Zap className="w-4 h-4 text-amber-600" />;
      case 'Plumbing': return <Droplets className="w-4 h-4 text-cyan-600" />;
      case 'IT': return <Monitor className="w-4 h-4 text-purple-600" />;
      default: return <Building2 className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'HVAC': return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', iconBg: 'bg-sky-100' };
      case 'Electrical': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', iconBg: 'bg-amber-100' };
      case 'Plumbing': return { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', iconBg: 'bg-cyan-100' };
      case 'IT': return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', iconBg: 'bg-purple-100' };
      default: return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', iconBg: 'bg-emerald-100' };
    }
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return {
          icon: AlertOctagon,
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
          iconColor: 'text-rose-600',
          iconBg: 'bg-rose-100'
        };
      case 'High':
        return {
          icon: Flame,
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-100'
        };
      case 'Medium':
        return {
          icon: Clock,
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100'
        };
      default:
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          iconColor: 'text-emerald-600',
          iconBg: 'bg-emerald-100'
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Page Hero Header with Icons */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span>AI-Powered Complaint Triage</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-sans">
          Report a Facility or Equipment Issue
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Type naturally in plain language. FixFlow AI categorizes the problem, detects duplicate campus reports using vector similarity, and dispatches the SLA.
        </p>
      </div>

      {/* Quick Demo Preset Selector Cards with Rich Icons */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Quick Demo Presets (Click to Test)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Auto-fills complaint box
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {DEMO_SAMPLES.map((sample, idx) => {
            const SampleIcon = sample.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  setComplaintText(sample.text);
                  setAnalysis(null);
                  setCreatedTicketId(null);
                }}
                className="text-left p-4 rounded-xl bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 transition-all duration-200 group cursor-pointer relative flex items-start gap-3.5"
              >
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 transition-colors ${
                  sample.color === 'amber'
                    ? 'bg-amber-100/70 text-amber-700 group-hover:bg-amber-200/80'
                    : sample.color === 'rose'
                    ? 'bg-rose-100/70 text-rose-700 group-hover:bg-rose-200/80'
                    : 'bg-indigo-100/70 text-indigo-700 group-hover:bg-indigo-200/80'
                }`}>
                  <SampleIcon className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-indigo-700 truncate">
                      {sample.title}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 border ${
                      sample.color === 'amber'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : sample.color === 'rose'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {sample.tag}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs line-clamp-1 italic">
                    "{sample.text}"
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Complaint Input Box */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="complaint-input" className="block text-sm font-bold text-slate-800">
              Describe the issue and where it is located
            </label>
            <span className="text-xs text-slate-400 font-medium">
              English • Natural Language
            </span>
          </div>
          <textarea
            id="complaint-input"
            rows={4}
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder="e.g. Water dripping from the ceiling air conditioning unit in Lab 3, creating a puddle near desk 4..."
            className="w-full rounded-xl bg-slate-50/60 border border-slate-200 p-4 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all leading-relaxed shadow-2xs"
          />
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium">
            <div className="p-1 rounded-lg bg-rose-100 text-rose-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span>{complaintText.length} characters</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleAnalyze(false)}
              disabled={loading || !complaintText.trim()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Preview AI Triage</span>
            </button>

            <button
              onClick={() => handleAnalyze(true)}
              disabled={loading || !complaintText.trim()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Submit Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Analysis Live Results Card */}
      {analysis && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  AI Classification & Incident Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Vector similarity duplicate check + automated triage dispatch
                </p>
              </div>
            </div>

            {createdTicketId ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-max shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ticket Created #{createdTicketId}
              </span>
            ) : (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 w-max">
                Live Pre-Flight Preview
              </span>
            )}
          </div>

          {/* Duplicate Detection Alert Banner with Icon and Visual Meter */}
          {analysis.is_duplicate ? (
            <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-3 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-amber-900 flex items-center gap-1.5">
                      <span>Duplicate Incident Warning!</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-800 font-semibold">Similarity:</span>
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                        {Math.round(analysis.duplicate_score * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-amber-800/90 leading-relaxed">
                    A matching open work order is already registered for this exact location:
                  </p>
                  
                  <div className="text-xs font-bold text-slate-800 bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="text-indigo-600 font-mono">#{analysis.duplicate_ticket_id}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span>"{analysis.matched_ticket_title}"</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200 shrink-0">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-800 font-medium">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <span><strong>New Unique Incident:</strong> Vector similarity check against all active campus tickets is well under duplicate threshold ({Math.round(analysis.duplicate_score * 100)}%).</span>
            </div>
          )}

          {/* Structured Triage 4-Card Grid with Distinct Colorful Icons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Category */}
            {(() => {
              const catBadge = getCategoryBadge(analysis.category);
              return (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <div className={`p-1 rounded-md ${catBadge.iconBg}`}>
                      {getCategoryIcon(analysis.category)}
                    </div>
                    <span>Category</span>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${catBadge.bg} ${catBadge.text} ${catBadge.border}`}>
                    <span>{analysis.category}</span>
                  </div>
                </div>
              );
            })()}

            {/* Location */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <div className="p-1 rounded-md bg-indigo-100 text-indigo-600">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span>Location</span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                {analysis.location}
              </p>
            </div>

            {/* Priority */}
            {(() => {
              const prioInfo = getPriorityInfo(analysis.priority);
              const PrioIcon = prioInfo.icon;
              return (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <div className={`p-1 rounded-md ${prioInfo.iconBg} ${prioInfo.iconColor}`}>
                      <PrioIcon className="w-3.5 h-3.5" />
                    </div>
                    <span>Priority</span>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${prioInfo.bg} ${prioInfo.text} ${prioInfo.border}`}>
                    <span>{analysis.priority}</span>
                  </div>
                </div>
              );
            })()}

            {/* Target SLA */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <div className="p-1 rounded-md bg-emerald-100 text-emerald-600">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span>Target SLA</span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono">
                {analysis.sla_hours} Hours Max
              </p>
            </div>
          </div>

          {/* AI Normalized Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>Normalized Incident Summary</span>
            </div>
            <p className="text-sm font-bold text-slate-800">
              {analysis.summary}
            </p>
          </div>

          {/* RAG Auto-Matched Protocol Card */}
          {analysis.matched_sop && (
            <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-indigo-900">
                      RAG Auto-Matched Protocol: {analysis.matched_sop.code}
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {analysis.matched_sop.title}
                    </h4>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-indigo-200 shadow-2xs w-max">
                  {Math.round(analysis.matched_sop.similarity * 100)}% Match
                </span>
              </div>

              {/* Action Steps with Number Badges */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                  Automated Resolution Steps:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {analysis.suggested_resolution_sop.map((step, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-indigo-100 text-xs text-slate-700">
                      <span className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                        {sIdx + 1}
                      </span>
                      <span className="font-medium leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Duplicate Confirmation Modal */}
      {showDuplicateModal && analysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-xl">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Similar Issue Already Active
                </h3>
                <p className="text-xs text-slate-500">
                  Deduplication check detected a match
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Our semantic vector search matched this complaint with <strong>{Math.round(analysis.duplicate_score * 100)}% similarity</strong> to an open ticket:
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="text-indigo-600 font-mono font-bold">
                Ticket #{analysis.duplicate_ticket_id}
              </div>
              <div className="text-slate-800 font-medium">
                "{analysis.matched_ticket_title}"
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Submitting duplicate complaints can overload technician dispatch queues. You can choose to proceed anyway or cancel.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-colors cursor-pointer"
              >
                Submit Ticket Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
