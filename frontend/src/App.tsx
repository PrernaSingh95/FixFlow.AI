import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import type { UserRole } from './components/Header';
import { StudentView } from './components/StudentView';
import { AdminView } from './components/AdminView';
import { TechnicianView } from './components/TechnicianView';
import { checkBackendHealth, getTickets, getAnalytics } from './api';
import type { Ticket, AnalyticsData } from './api';
import { Sparkles, ShieldCheck, Activity } from 'lucide-react';

export const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>('student');
  const [backendOnline, setBackendOnline] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const health = await checkBackendHealth();
      setBackendOnline(health.status === 'healthy');

      const [ticketList, stats] = await Promise.all([
        getTickets(),
        getAnalytics().catch(() => null)
      ]);

      setTickets(ticketList);
      if (stats) setAnalytics(stats);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-slate-50 bg-mesh-glow text-slate-800 flex flex-col selection:bg-indigo-100 selection:text-indigo-900 font-sans relative">
      {/* Universal Clean Header with Role Switcher */}
      <Header
        currentRole={role}
        onRoleChange={setRole}
        backendOnline={backendOnline}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main View Area with Generous Whitespace */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {role === 'student' && (
          <StudentView onTicketCreated={handleManualRefresh} />
        )}

        {role === 'admin' && (
          <AdminView 
            tickets={tickets} 
            analytics={analytics} 
            onRefresh={handleManualRefresh} 
          />
        )}

        {role === 'technician' && (
          <TechnicianView 
            tickets={tickets} 
            onRefresh={handleManualRefresh} 
          />
        )}
      </main>

      {/* Clean Modern Footer */}
      <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-md py-6 px-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">FixFlow AI</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">Autonomous Incident Triage, Duplicate Filter & SOP Copilot</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>FastAPI Vector Engine</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>SQLite Memory Sync</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
