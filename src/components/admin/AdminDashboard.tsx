import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminUser, Participant, EventSettings, AuditLog } from '../../types/participant';
import { RCEvent, INITIAL_EVENTS } from '../../types/event';
import {
  fetchParticipants,
  fetchAuditLogs,
  fetchEventSettings,
  fetchEvents,
  saveLocalEventSettings,
  subscribeToParticipants,
  subscribeToEventSettings,
  INITIAL_EVENT_SETTINGS,
} from '../../services/supabaseClient';
import {
  getStoredAdminSession,
  saveStoredAdminSession,
  clearStoredAdminSession,
} from '../../utils/sessionHelper';

import { AdminAuthGate } from './AdminAuthGate';
import { AdminHeader, AdminTabId } from './AdminHeader';
import { ErrorBoundary } from '../ErrorBoundary';

// Lazy load admin tabs for lightweight on-demand loading
const AdminOverviewTab = lazy(() =>
  import('./AdminOverviewTab').then((module) => ({ default: module.AdminOverviewTab }))
);
const AdminEventsTab = lazy(() =>
  import('./AdminEventsTab').then((module) => ({ default: module.AdminEventsTab }))
);
const AdminFamsTab = lazy(() =>
  import('./AdminFamsTab').then((module) => ({ default: module.AdminFamsTab }))
);
const AdminParticipantsTab = lazy(() =>
  import('./AdminParticipantsTab').then((module) => ({ default: module.AdminParticipantsTab }))
);
const AdminScoringTab = lazy(() =>
  import('./AdminScoringTab').then((module) => ({ default: module.AdminScoringTab }))
);
const AdminRolesTab = lazy(() =>
  import('./AdminRolesTab').then((module) => ({ default: module.AdminRolesTab }))
);
const AdminReportsTab = lazy(() =>
  import('./AdminReportsTab').then((module) => ({ default: module.AdminReportsTab }))
);
const AdminHistoryTab = lazy(() =>
  import('./AdminHistoryTab').then((module) => ({ default: module.AdminHistoryTab }))
);
const AdminSettingsTab = lazy(() =>
  import('./AdminSettingsTab').then((module) => ({ default: module.AdminSettingsTab }))
);
const AdminAccountSettingsTab = lazy(() =>
  import('./AdminAccountSettingsTab').then((module) => ({ default: module.AdminAccountSettingsTab }))
);

// Tab loading placeholder
const TabLoadingFallback = () => (
  <div className="py-20 flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
    <span className="text-xs font-mono text-slate-400">Memuat modul data...</span>
  </div>
);

interface AdminDashboardProps {
  onBackToLanding: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToLanding }) => {
  // Check if session exists in persistent storage
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => getStoredAdminSession());

  // Calculate default initial tab based on role
  const getDefaultTabForRole = (role?: string): AdminTabId => {
    if (role === 'panitia') return 'participants';
    if (role === 'juri') return 'scoring';
    if (role === 'superadmin') return 'roles';
    if (role === 'stage_mgr') return 'participants';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<AdminTabId>(() => getDefaultTabForRole(currentUser?.role));

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [eventSettings, setEventSettings] = useState<EventSettings>(INITIAL_EVENT_SETTINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [events, setEvents] = useState<RCEvent[]>(INITIAL_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  // Load data directly from Supabase
  const loadData = async () => {
    try {
      const [resParticipants, resSettings, resLogs, resEvents] = await Promise.all([
        fetchParticipants(),
        fetchEventSettings(),
        fetchAuditLogs(),
        fetchEvents(),
      ]);
      setParticipants(resParticipants.data);
      setEventSettings(resSettings);
      setAuditLogs(resLogs);
      if (resEvents.data && resEvents.data.length > 0) setEvents(resEvents.data);
    } catch (err) {
      console.warn('Error loading dashboard data from Supabase:', err);
    }
  };

  useEffect(() => {
    loadData();

    const unsubParticipants = subscribeToParticipants((updated) => {
      setParticipants(updated);
      fetchAuditLogs().then(setAuditLogs);
    });

    const unsubSettings = subscribeToEventSettings((updatedSettings) => {
      setEventSettings(updatedSettings);
    });

    return () => {
      unsubParticipants();
      unsubSettings();
    };
  }, []);

  // When user logs in, set their default authorized tab
  const handleAuthenticated = (user: AdminUser) => {
    setCurrentUser(user);
    setActiveTab(getDefaultTabForRole(user.role));
  };

  const handleLogout = () => {
    clearStoredAdminSession();
    setCurrentUser(null);
  };

  // If not logged in, render the Auth Gate (Hidden login portal)
  if (!currentUser) {
    return (
      <AdminAuthGate
        onAuthenticated={handleAuthenticated}
        onBackToHome={onBackToLanding}
      />
    );
  }

  // Define authorized tabs per role
  const roleAllowedTabs: Record<string, AdminTabId[]> = {
    superadmin: ['roles', 'events', 'fams', 'settings', 'account', 'overview', 'participants', 'scoring', 'reports', 'history'],
    panitia: ['participants', 'fams', 'events', 'account', 'history'],
    juri: ['scoring', 'reports', 'account'],
    stage_mgr: ['participants', 'events', 'account'],
    viewer: ['overview', 'events', 'fams', 'participants', 'reports', 'account', 'history'],
  };

  const allowedTabs = roleAllowedTabs[currentUser.role] || ['participants'];

  // Guard: if current activeTab is not allowed for user role, redirect to their first allowed tab
  const effectiveTab: AdminTabId = allowedTabs.includes(activeTab) ? activeTab : allowedTabs[0];

  // --- Event selector: filter participants to the chosen event ---
  const selectedEvent: RCEvent | null =
    selectedEventId === 'all'
      ? null
      : events.find((e) => e.id === selectedEventId) ?? null;

  const filteredParticipants = useMemo(
    () =>
      selectedEventId === 'all'
        ? participants
        : participants.filter((p) => p.eventId === selectedEventId),
    [participants, selectedEventId]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Admin Navbar with Role Display */}
      <AdminHeader
        currentUser={currentUser}
        activeTab={effectiveTab}
        onSelectTab={(tab) => {
          if (allowedTabs.includes(tab)) {
            setActiveTab(tab);
          }
        }}
        onLogout={handleLogout}
        onGoToLanding={onBackToLanding}
        totalParticipants={filteredParticipants.length}
      />

      {/* Event context selector — applies to Peserta, Penilaian, Laporan */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Event yang dikelola
          </span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="flex-1 min-w-[200px] rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-pink-400"
          >
            <option value="all">Semua event ({participants.length} peserta)</option>
            {events.map((e) => {
              const count = participants.filter((p) => p.eventId === e.id).length;
              const badge = e.status === 'open' ? '🟢' : e.status === 'ongoing' ? '🟡' : e.status === 'ended' ? '⚪' : '🔵';
              return (
                <option key={e.id} value={e.id}>
                  {badge} {e.title} — {count} peserta
                </option>
              );
            })}
          </select>
          {selectedEvent && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                selectedEvent.status === 'open'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : selectedEvent.status === 'ongoing'
                    ? 'bg-amber-500/20 text-amber-300'
                    : selectedEvent.status === 'ended'
                      ? 'bg-slate-500/20 text-slate-300'
                      : 'bg-sky-500/20 text-sky-300'
              }`}
            >
              Status: {selectedEvent.status}
            </span>
          )}
        </div>
      </div>

      {/* Main Admin Content View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary
          fallbackTitle="Kendala Memuat Tampilan Tab"
          onReset={() => {
            loadData();
            setActiveTab(getDefaultTabForRole(currentUser.role));
          }}
        >
          <Suspense fallback={<TabLoadingFallback />}>
            <AnimatePresence mode="wait">
            {effectiveTab === 'overview' && (currentUser.role === 'superadmin' || currentUser.role === 'viewer') && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AdminOverviewTab
                  participants={filteredParticipants}
                  eventSettings={eventSettings}
                  auditLogs={auditLogs}
                  currentUser={currentUser}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onUpdateEventSettings={(updated) => {
                    if (currentUser.role === 'viewer') return;
                    const newSettings = { ...eventSettings, ...updated };
                    setEventSettings(newSettings);
                    saveLocalEventSettings(newSettings);
                  }}
                />
              </motion.div>
            )}

            {effectiveTab === 'events' && (currentUser.role === 'superadmin' || currentUser.role === 'panitia' || currentUser.role === 'stage_mgr' || currentUser.role === 'viewer') && (
              <motion.div
                key="events"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AdminEventsTab
                  currentUser={currentUser}
                  participants={participants || []}
                  onNavigateToEventPreview={(eventId) => {
                    window.location.hash = `/event/${eventId}`;
                    onBackToLanding();
                  }}
                />
              </motion.div>
            )}

            {effectiveTab === 'fams' && (currentUser.role === 'superadmin' || currentUser.role === 'panitia' || currentUser.role === 'viewer') && (
              <motion.div
                key="fams"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AdminFamsTab
                  currentUser={currentUser}
                />
              </motion.div>
            )}

            {effectiveTab === 'participants' && (currentUser.role === 'panitia' || currentUser.role === 'superadmin' || currentUser.role === 'stage_mgr' || currentUser.role === 'viewer') && (
              <motion.div
                key="participants"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AdminParticipantsTab
                  participants={filteredParticipants}
                  currentUser={currentUser}
                  onRefresh={loadData}
                  onOpenScoreModal={() => {
                    if (allowedTabs.includes('scoring')) {
                      setActiveTab('scoring');
                    }
                  }}
                />
              </motion.div>
            )}

            {effectiveTab === 'scoring' && (currentUser.role === 'juri' || currentUser.role === 'superadmin') && (
              <motion.div
                key="scoring"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AdminScoringTab
                  participants={filteredParticipants}
                  currentUser={currentUser}
                  onRefresh={loadData}
                />
              </motion.div>
            )}

            {effectiveTab === 'roles' && currentUser.role === 'superadmin' && (
              <motion.div
                key="roles"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AdminRolesTab
                  currentUser={currentUser}
                  onUpdateCurrentUser={(updated) => {
                    setCurrentUser(updated);
                    saveStoredAdminSession(updated);
                  }}
                />
              </motion.div>
            )}

            {effectiveTab === 'reports' && (currentUser.role === 'superadmin' || currentUser.role === 'viewer' || currentUser.role === 'juri') && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AdminReportsTab
                  participants={filteredParticipants}
                  currentUser={currentUser}
                  onRefresh={loadData}
                />
              </motion.div>
            )}

            {effectiveTab === 'history' && (currentUser.role === 'superadmin' || currentUser.role === 'viewer' || currentUser.role === 'panitia') && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AdminHistoryTab
                  events={events}
                  participants={participants}
                  onViewEvent={(eventId) => {
                    window.location.hash = `/event/${eventId}`;
                    onBackToLanding();
                  }}
                />
              </motion.div>
            )}

            {effectiveTab === 'settings' && currentUser.role === 'superadmin' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AdminSettingsTab
                  eventSettings={eventSettings}
                  currentUser={currentUser}
                  onUpdateSettings={setEventSettings}
                  onResetParticipants={loadData}
                />
              </motion.div>
            )}

            {effectiveTab === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AdminAccountSettingsTab
                  currentUser={currentUser}
                  onUpdateCurrentUser={(updated) => {
                    setCurrentUser(updated);
                    saveStoredAdminSession(updated);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </ErrorBoundary>
    </main>
  </div>
);
};
