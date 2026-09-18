import React, { useState, useEffect } from 'react';
import { 
  updateTicketStatus, 
  addTicketNote, 
  getSOPs 
} from '../api';
import type { Ticket, SOPDocument } from '../api';
import { 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  FileText, 
  Send, 
  Play, 
  RotateCcw,
  Wrench,
  Wind,
  Zap,
  Droplets,
  Monitor,
  Building2,
  BookOpen
} from 'lucide-react';


interface TechnicianViewProps {
  tickets: Ticket[];
  onRefresh: () => void;
}

export const TechnicianView: React.FC<TechnicianViewProps> = ({
  tickets,
  onRefresh
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [sops, setSops] = useState<SOPDocument[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    getSOPs()
      .then(setSops)
      .catch(err => console.error('Failed to load SOPs', err));
  }, []);

  const activeTickets = tickets.filter(t => t.status !== 'RESOLVED');
  const activeTicket = tickets.find(t => t.id === selectedTicketId) || activeTickets[0] || tickets[0] || null;
  const relevantSop = sops.find(s => s.category.toLowerCase() === activeTicket?.category.toLowerCase()) || sops[0];

  const handleToggleStep = (stepIdx: number) => {
    if (!activeTicket) return;
    const key = `${activeTicket.id}_step_${stepIdx}`;
    setCompletedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeTicket) return;
    setActionLoading(true);
    try {
      await updateTicketStatus(activeTicket.id, newStatus);
      onRefresh();
    } catch (err) {
      console.error('Failed to update ticket status', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!activeTicket || !noteText.trim()) return;
    setIsSubmittingNote(true);
    try {
      await addTicketNote(activeTicket.id, noteText.trim());
      setNoteText('');
      onRefresh();
    } catch (err) {
      console.error('Failed to add technician note', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HVAC': return <Wind className="w-3.5 h-3.5 text-sky-600" />;
      case 'Electrical': return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      case 'Plumbing': return <Droplets className="w-3.5 h-3.5 text-cyan-600" />;
      case 'IT': return <Monitor className="w-3.5 h-3.5 text-purple-600" />;
      default: return <Building2 className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'High': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Medium': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    }
  };

  const calculateStepProgress = () => {
    if (!activeTicket || !relevantSop?.action_steps) return { completed: 0, total: 0, percent: 0 };
    const total = relevantSop.action_steps.length;
    let completed = 0;
    for (let i = 0; i < total; i++) {
      if (completedSteps[`${activeTicket.id}_step_${i}`]) completed++;
    }
    return { completed, total, percent: Math.round((completed / total) * 100) };
  };

  const progress = calculateStepProgress();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-2 shadow-2xs">
          <Wrench className="w-3.5 h-3.5" />
          <span>Technician Field Workspace</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
          Field Terminal & SOP Copilot
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Prioritized work orders with RAG-retrieved standard operating procedure checklists.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Actionable Queue */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-indigo-600" />
              Assigned Work Queue ({activeTickets.length})
            </span>
          </div>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {tickets.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center text-slate-400 text-xs border border-slate-200 shadow-2xs">
                No tickets in database.
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = activeTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 shadow-sm ring-2 ring-indigo-50'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-md bg-white border border-slate-200 shadow-2xs">
                          {getCategoryIcon(t.category)}
                        </div>
                        <span className="font-mono font-bold text-xs text-indigo-600">
                          {t.ticket_number}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPriorityStyle(t.priority)}`}>
                          {t.priority}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          t.status === 'RESOLVED' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 mb-2">
                      {t.title}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {t.location}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        SLA: {t.sla_hours}h
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Ticket Inspector & SOP Resolution Card */}
        <div className="lg:col-span-8">
          {activeTicket ? (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              {/* Card Header & Status Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-indigo-600">
                      {activeTicket.ticket_number}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getPriorityStyle(activeTicket.priority)}`}>
                      {activeTicket.priority} Priority
                    </span>
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      • {getCategoryIcon(activeTicket.category)} {activeTicket.category}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {activeTicket.title}
                  </h2>
                </div>

                {/* Status Action Buttons with Icons */}
                <div className="flex items-center gap-2.5">
                  {activeTicket.status !== 'IN_PROGRESS' && activeTicket.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus('IN_PROGRESS')}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Work</span>
                    </button>
                  )}

                  {activeTicket.status !== 'RESOLVED' ? (
                    <button
                      onClick={() => handleUpdateStatus('RESOLVED')}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Resolved</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus('IN_PROGRESS')}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reopen Order</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Location & Metadata Bar with Colorful Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Location</span>
                  </div>
                  <p className="font-extrabold text-slate-900">{activeTicket.location}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Target SLA</span>
                  </div>
                  <p className="font-extrabold text-slate-900 font-mono">{activeTicket.sla_hours} Hours Max</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <Wrench className="w-3.5 h-3.5 text-purple-600" />
                    <span>Status</span>
                  </div>
                  <p className="font-extrabold text-indigo-700">{activeTicket.status}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reported Date</span>
                  </div>
                  <p className="font-bold text-slate-800 font-mono text-[11px] truncate">
                    {activeTicket.created_at.split('T')[0] || activeTicket.created_at}
                  </p>
                </div>
              </div>

              {/* Raw User Incident Complaint */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Raw Reporter Complaint
                </span>
                <p className="text-xs sm:text-sm text-slate-800 italic font-medium leading-relaxed">
                  "{activeTicket.raw_complaint}"
                </p>
              </div>

              {/* RAG Standard Operating Procedure Copilot Checklist */}
              {relevantSop && (
                <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-indigo-100 text-indigo-700">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="font-mono text-xs font-extrabold text-indigo-800">
                          {relevantSop.code}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                          RAG Copilot Playbook
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                        {relevantSop.title}
                      </h4>
                    </div>
                    <span className="text-xs text-slate-600 font-bold bg-white px-3 py-1 rounded-lg border border-indigo-100 shadow-2xs">
                      Target Equipment: {relevantSop.equipment_type}
                    </span>
                  </div>

                  {/* Checklist Steps with Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-900 uppercase tracking-wider text-[11px]">
                        Step-by-Step Resolution Protocol:
                      </span>
                      <span className="font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                        {progress.completed} of {progress.total} Complete ({progress.percent}%)
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {relevantSop.action_steps.map((step, idx) => {
                        const isDone = !!completedSteps[`${activeTicket.id}_step_${idx}`];
                        return (
                          <div
                            key={idx}
                            onClick={() => handleToggleStep(idx)}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                              isDone
                                ? 'bg-emerald-50/80 border-emerald-300 text-slate-500'
                                : 'bg-white border-slate-200/90 text-slate-800 hover:border-indigo-300 shadow-2xs'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isDone ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 text-xs leading-relaxed font-semibold">
                              <span className={`inline-block mr-2 font-mono font-bold ${isDone ? 'text-emerald-700' : 'text-indigo-600'}`}>
                                Step {idx + 1}:
                              </span>
                              <span className={isDone ? 'line-through text-slate-400' : 'text-slate-800'}>
                                {step}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Technician Diagnostic / Work Log Notes */}
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Field Technician Work Log & Diagnostic Remarks
                </span>

                {activeTicket.technician_notes ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-mono leading-relaxed shadow-2xs">
                    {activeTicket.technician_notes}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No diagnostic remarks recorded yet for this work order.
                  </p>
                )}

                {/* Add Note Input */}
                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Log actions taken e.g. Cleared condensate line, tested pan float switch..."
                    className="flex-1 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={isSubmittingNote || !noteText.trim()}
                    className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Log Remark</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl text-center text-slate-400 border border-slate-200 font-semibold shadow-2xs">
              Select a work order from the queue to inspect details and SOP checklist.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple Calendar icon component fallback
const Calendar = ({ className }: { className?: string }) => (
  <Clock className={className} />
);
