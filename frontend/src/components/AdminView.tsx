import React, { useState } from 'react';
import { updateTicketStatus } from '../api';
import type { Ticket, AnalyticsData } from '../api';
import { 
  BarChart3, 
  AlertCircle, 
  Clock, 
  Copy, 
  Filter, 
  Search, 
  Flame, 
  Layers,
  Wind,
  Zap,
  Droplets,
  Monitor,
  Building2,
  AlertOctagon,
  CheckCircle2,
  PlayCircle,
  FolderOpen
} from 'lucide-react';

interface AdminViewProps {
  tickets: Ticket[];
  analytics: AnalyticsData | null;
  onRefresh: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  tickets,
  analytics,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    setUpdatingId(ticketId);
    try {
      await updateTicketStatus(ticketId, newStatus);
      onRefresh();
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.raw_complaint.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HVAC': return <Wind className="w-3.5 h-3.5 text-sky-600" />;
      case 'Electrical': return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      case 'Plumbing': return <Droplets className="w-3.5 h-3.5 text-cyan-600" />;
      case 'IT': return <Monitor className="w-3.5 h-3.5 text-purple-600" />;
      default: return <Building2 className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-3 h-3 text-rose-600" />
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Flame className="w-3 h-3 text-amber-600" />
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
            Open
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
            In Progress
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Resolved
          </span>
        );
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-2 shadow-2xs">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Operations & Dispatch Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            Facility Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time ticket triage, duplicate incident suppression, and technician SLA tracking.
          </p>
        </div>
      </div>

      {/* KPI Metrics 5-Card Ribbon with Rich Icons */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tickets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Tickets</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {analytics ? analytics.total_tickets : tickets.length}
          </div>
          <p className="text-[11px] text-slate-400 font-semibold">
            Active campus records
          </p>
        </div>

        {/* Active Open Backlog */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Open Backlog</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600">
            {analytics ? analytics.open_tickets : tickets.filter(t => t.status === 'OPEN').length}
          </div>
          <p className="text-[11px] text-amber-700 font-semibold">
            Awaiting technician
          </p>
        </div>

        {/* High & Critical Priority */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Critical / High</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600">
            {analytics ? analytics.high_priority_count : tickets.filter(t => t.priority === 'High' || t.priority === 'Critical').length}
          </div>
          <p className="text-[11px] text-rose-700 font-semibold">
            Urgent SLA target
          </p>
        </div>

        {/* Duplicates Suppressed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Duplicates Filtered</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Copy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600">
            {analytics ? analytics.duplicate_count : tickets.filter(t => t.is_duplicate).length}
          </div>
          <p className="text-[11px] text-purple-700 font-semibold">
            Vector similarity check
          </p>
        </div>

        {/* Mean SLA Target */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 col-span-2 lg:col-span-1 hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Average SLA</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono">
            {analytics ? `${analytics.avg_sla_hours}h` : '16.5h'}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold">
            Resolution turnaround
          </p>
        </div>
      </div>

      {/* Domain Breakdown with Icons */}
      {analytics && analytics.category_distribution && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                <Layers className="w-3.5 h-3.5" />
              </div>
              Incident Distribution by Domain
            </span>
            <span className="text-slate-400 font-semibold">
              {Object.values(analytics.category_distribution).reduce((a, b) => a + b, 0)} Total Tickets
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            {Object.entries(analytics.category_distribution).map(([cat, count]) => (
              <div key={cat} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-white border border-slate-200 shadow-2xs">
                    {getCategoryIcon(cat)}
                  </div>
                  <span className="text-slate-800 font-bold">{cat}</span>
                </div>
                <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ticket #, summary, room location, or complaint..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all shadow-2xs"
          />
        </div>

        {/* Filter Dropdowns with Icons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold pr-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Categories</option>
            <option value="HVAC">HVAC</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="IT">IT</option>
            <option value="Infrastructure">Infrastructure</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Ticket Master Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-4 px-5">Ticket</th>
                <th className="py-4 px-5">Summary & Complaint</th>
                <th className="py-4 px-5">Category</th>
                <th className="py-4 px-5">Location</th>
                <th className="py-4 px-5">Priority</th>
                <th className="py-4 px-5">SLA</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm font-semibold">
                    No tickets found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Ticket # and duplicate badge */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono font-bold text-indigo-600 text-xs">
                          {t.ticket_number}
                        </span>
                        {t.is_duplicate && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 w-max shadow-2xs">
                            <Copy className="w-2.5 h-2.5" />
                            Dup of #{t.duplicate_of_id || 'TKT-1001'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Title & Complaint */}
                    <td className="py-4 px-5 max-w-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 truncate">
                          {t.title}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          "{t.raw_complaint}"
                        </div>
                      </div>
                    </td>

                    {/* Category with Icon */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                        {getCategoryIcon(t.category)}
                        <span>{t.category}</span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="text-slate-700 font-semibold">
                        {t.location}
                      </span>
                    </td>

                    {/* Priority with Icon */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      {getPriorityBadge(t.priority)}
                    </td>

                    {/* Target SLA */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="text-slate-700 font-mono text-xs font-bold">
                        {t.sla_hours}h
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      {getStatusBadge(t.status)}
                    </td>

                    {/* Quick Status Select */}
                    <td className="py-4 px-5 whitespace-nowrap text-right">
                      <select
                        value={t.status}
                        disabled={updatingId === t.id}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
