/**
 * @license
 * RC Fams Community & Event Ecosystem
 * Rainbow Candy Official Portal
 */

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ThemeId, THEMES, ThemeConfig, getDefaultThemeByDay } from './src/types/theme';
import { Participant } from './src/types/participant';
import { RCEvent, INITIAL_EVENTS } from './src/types/event';
import {
  fetchParticipants,
  subscribeToParticipants,
  fetchEvents,
  subscribeToEvents,
  isSupabaseConfigured,
} from './src/services/supabaseClient';

// Core Landing & Event Components
import { Header } from './src/components/Header';
import { HeroSection } from './src/components/HeroSection';
import { PrizeShowcase } from './src/components/PrizeShowcase';
import { RegistrationSection } from './src/components/RegistrationSection';
import { LiveParticipantBoard } from './src/components/LiveParticipantBoard';
import { EventDetailsSection } from './src/components/EventDetailsSection';
import { Footer } from './src/components/Footer';
import { ThemeSwitcher } from './src/components/ThemeSwitcher';
import { BackgroundAudioPlayer } from './src/components/BackgroundAudioPlayer';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Code-Split & Lazy Loaded Heavy / Secondary Components for Maximum Lightweight Performance
const RainbowProfilePage = lazy(() =>
  import('./src/components/RainbowProfilePage').then((mod) => ({ default: mod.RainbowProfilePage }))
);
const EventListPage = lazy(() =>
  import('./src/components/EventListPage').then((mod) => ({ default: mod.EventListPage }))
);
const EndedEventWinnerShowcase = lazy(() =>
  import('./src/components/EndedEventWinnerShowcase').then((mod) => ({ default: mod.EndedEventWinnerShowcase }))
);
const AdminDashboard = lazy(() =>
  import('./src/components/admin/AdminDashboard').then((mod) => ({ default: mod.AdminDashboard }))
);
const EventPosterModal = lazy(() =>
  import('./src/components/EventPosterModal').then((mod) => ({ default: mod.EventPosterModal }))
);
const TermsModal = lazy(() =>
  import('./src/components/TermsModal').then((mod) => ({ default: mod.TermsModal }))
);

// Minimalist Portal Loading State
const AdminLoadingFallback = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-100 font-sans">
    <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shadow-lg shadow-amber-400/10">
      <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
    <div className="text-center">
      <p className="font-serif-luxury text-base font-bold text-amber-300">RC Admin Portal</p>
      <p className="text-xs text-slate-500 font-mono mt-0.5">Menyiapkan modul terenkripsi...</p>
    </div>
  </div>
);

// Lightweight Page Loading Fallback for public views
const PageLoadingFallback: React.FC<{ theme: ThemeConfig }> = ({ theme }) => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 py-28 text-current">
    <div
      className="w-10 h-10 border-2 rounded-full animate-spin"
      style={{
        borderColor: `${theme.accentPrimary}30`,
        borderTopColor: theme.accentPrimary,
      }}
    />
    <p className="text-xs font-mono tracking-widest uppercase opacity-70">Memuat Konten...</p>
  </div>
);

/**
 * Staggered entrance animation variants for sections as they scroll into view.
 */
const sectionEntranceVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 38,
    filter: 'blur(6px)',
  },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.82,
      delay: 0.06 * (index % 3),
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

interface StaggeredSectionProps {
  children: React.ReactNode;
  index: number;
  className?: string;
}

const StaggeredSection: React.FC<StaggeredSectionProps> = ({
  children,
  index,
  className = '',
}) => {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1, margin: '0px 0px -50px 0px' }}
      variants={sectionEntranceVariants}
      className={`relative w-full ${className}`}
    >
      {children}
    </motion.div>
  );
};

export type AppView = 'profile' | 'events' | 'event-detail' | 'admin';

const App: React.FC = () => {
  // Theme state initialized based on day of week
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(() => getDefaultThemeByDay());
  const currentTheme: ThemeConfig = THEMES[currentThemeId] || THEMES['dark-virgo-gold'];

  // Event Poster Modal state
  const [isPosterModalOpen, setIsPosterModalOpen] = useState<boolean>(false);

  // Syarat & Ketentuan (Terms & Conditions) Modal state
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);

  // Events list & selected event
  const [events, setEvents] = useState<RCEvent[]>(INITIAL_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState<string>('rc-virgo-party-2026');

  // Helper to extract event ID from URL hash or query params
  const extractEventIdFromUrl = (): string | null => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash || '';
    const match = hash.match(/#\/?event\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('eventId') || params.get('event');
  };

  // Helper to check if current URL points to the Admin / Judge Dashboard
  const checkIsAdminRoute = (): boolean => {
    if (typeof window === 'undefined') return false;
    const hash = (window.location.hash || '').toLowerCase();
    const pathname = (window.location.pathname || '').toLowerCase().replace(/\/+$/, '');
    const params = new URLSearchParams(window.location.search);

    return (
      pathname === '/admin' ||
      pathname === '/dashboard' ||
      pathname === '/panel' ||
      pathname.endsWith('/admin') ||
      pathname.endsWith('/dashboard') ||
      pathname.endsWith('/panel') ||
      hash === '#admin' ||
      hash === '#/admin' ||
      hash === '#dashboard' ||
      hash === '#/dashboard' ||
      hash === '#panel' ||
      hash === '#/panel' ||
      params.get('admin') === 'true' ||
      params.get('view') === 'admin'
    );
  };

  // Helper to check if current URL points to the Event Catalog / List Page
  const checkIsEventsListRoute = (): boolean => {
    if (typeof window === 'undefined') return false;
    const hash = (window.location.hash || '').toLowerCase();
    const params = new URLSearchParams(window.location.search);

    return (
      hash === '#events' ||
      hash === '#/events' ||
      hash === '#event-list' ||
      hash === '#/event-list' ||
      hash === '#katalog' ||
      params.get('view') === 'events' ||
      params.get('view') === 'event-list'
    );
  };

  // Helper to check if current URL points to a specific Event Information / Registration Page
  const checkIsEventDetailRoute = (): boolean => {
    if (typeof window === 'undefined') return false;
    const hash = (window.location.hash || '').toLowerCase();
    const params = new URLSearchParams(window.location.search);

    return (
      hash === '#event' ||
      hash.startsWith('#event/') ||
      hash.startsWith('#/event/') ||
      hash === '#hadiah' ||
      hash === '#daftar' ||
      hash === '#peserta' ||
      params.get('view') === 'event' ||
      params.get('event') === 'true' ||
      Boolean(params.get('eventId'))
    );
  };

  // Determine initial view: 'profile' (Default Fams Company Profile front page), 'events', 'event-detail', or 'admin'
  const determineInitialView = (): AppView => {
    if (checkIsAdminRoute()) return 'admin';
    if (checkIsEventsListRoute()) return 'events';
    if (checkIsEventDetailRoute()) {
      const paramEvId = extractEventIdFromUrl();
      if (paramEvId) setSelectedEventId(paramEvId);
      return 'event-detail';
    }
    return 'profile';
  };

  // Route / View State
  const [currentView, setCurrentView] = useState<AppView>(determineInitialView);

  // Load events from database & sync with real-time updates
  const loadEventsData = useCallback(async () => {
    try {
      const { data } = await fetchEvents();
      if (data && data.length > 0) {
        setEvents(data);
      }
    } catch (err) {
      console.warn('Error loading events:', err);
    }
  }, []);

  useEffect(() => {
    loadEventsData();
    const unsubscribeEvents = subscribeToEvents((updated) => {
      setEvents(updated);
    });
    return () => {
      unsubscribeEvents();
    };
  }, [loadEventsData]);

  // Listen to hash changes, popstate, and secret keyboard shortcut
  useEffect(() => {
    const handleLocationChange = () => {
      if (checkIsAdminRoute()) {
        setCurrentView('admin');
      } else if (checkIsEventsListRoute()) {
        setCurrentView('events');
      } else if (checkIsEventDetailRoute()) {
        const evId = extractEventIdFromUrl();
        if (evId) setSelectedEventId(evId);
        setCurrentView('event-detail');
      } else {
        const hash = (window.location.hash || '').toLowerCase();
        // If hash is empty, or points to profile sections (#tentang, #visi-misi, #program, etc.), show profile
        if (
          !hash ||
          hash === '#' ||
          hash === '#/' ||
          hash === '#beranda' ||
          hash.startsWith('#tentang') ||
          hash.startsWith('#visi') ||
          hash.startsWith('#program') ||
          hash.startsWith('#struktur') ||
          hash.startsWith('#kontak')
        ) {
          setCurrentView('profile');
        }
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    // Secret Admin Shortcut: Ctrl + Shift + A (or Cmd + Shift + A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        window.location.hash = '/admin';
        setCurrentView('admin');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Safe handler to return from Admin
  const handleBackToLanding = () => {
    if (window.location.hash) {
      window.location.hash = '';
    }
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('admin') || pathname.includes('dashboard') || pathname.includes('panel')) {
      window.history.pushState(null, '', '/');
    }
    if (window.location.search.includes('admin') || window.location.search.includes('view')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setCurrentView('profile');
  };

  // Handler to navigate from Profile to Event List Page
  const handleNavigateToEventList = () => {
    setCurrentView('events');
    window.location.hash = 'events';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler to select an event from Event List Page
  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentView('event-detail');
    window.location.hash = `event/${eventId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler to navigate back to Profile
  const handleNavigateToProfile = () => {
    setCurrentView('profile');
    if (window.location.hash) {
      window.history.pushState(null, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Participants data state
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState<boolean>(true);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);

  // Load participants data
  const loadParticipantsData = useCallback(async () => {
    setIsLoadingParticipants(true);
    try {
      const { data, isRealtime } = await fetchParticipants();
      setParticipants(data);
      setIsRealtimeActive(isRealtime);
    } catch (err) {
      console.warn('Error loading participants:', err);
    } finally {
      setIsLoadingParticipants(false);
    }
  }, []);

  // Initialize data and real-time subscription
  useEffect(() => {
    loadParticipantsData();

    // Subscribe to realtime database changes (Supabase Realtime Channel & Local Event Dispatcher)
    const unsubscribe = subscribeToParticipants((updatedParticipants) => {
      setParticipants(updatedParticipants);
    });

    return () => {
      unsubscribe();
    };
  }, [loadParticipantsData]);

  // Handle new registration from landing page
  const handleNewRegistration = (newParticipant: Participant) => {
    setParticipants((prev) => [newParticipant, ...prev.filter((p) => p.id !== newParticipant.id)]);
  };

  // Find currently active event object
  const activeEvent: RCEvent =
    events.find((e) => e.id === selectedEventId) || events[0] || INITIAL_EVENTS[0];

  // Participants filtered for the active event
  const activeEventParticipants = participants.filter((p) => {
    const pEventId = p.eventId || 'rc-virgo-party-2026';
    return pEventId === activeEvent.id;
  });

  // Prepare custom prizes array for PrizeShowcase if present on activeEvent
  const activePrizesFormatted = activeEvent.prizes
    ? [
        {
          rank: 1,
          title: 'Juara 1',
          reward: activeEvent.prizes.juara1 || 'Rp 1.500.000',
          description: 'The Grand Champion',
        },
        {
          rank: 2,
          title: 'Juara 2',
          reward: activeEvent.prizes.juara2 || 'Rp 1.000.000',
          description: 'Runner Up I',
        },
        {
          rank: 3,
          title: 'Juara 3',
          reward: activeEvent.prizes.juara3 || 'Rp 500.000',
          description: 'Runner Up II',
        },
      ]
    : undefined;

  // If Admin View is active, render the protected Admin Dashboard
  if (currentView === 'admin') {
    return (
      <ErrorBoundary
        fallbackTitle="Pusat Kendali Admin Terkendala"
        onReset={handleBackToLanding}
      >
        <Suspense fallback={<AdminLoadingFallback />}>
          <AdminDashboard onBackToLanding={handleBackToLanding} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Otherwise, render Public Views (profile, events, event-detail) inside a persistent layout shell.
  // CRITICAL: BackgroundAudioPlayer is placed at this persistent root level so music NEVER restarts or loops
  // repeatedly when navigating between Landing Page (profile), Event Catalog (events), and Event Details!
  const isEventEnded = activeEvent.status === 'ended';

  return (
    <div
      className={`min-h-screen transition-colors duration-500 selection:bg-amber-400 selection:text-slate-950 relative overflow-x-hidden ${currentTheme.bgClass}`}
      style={currentTheme.bgStyle}
    >
      {/* View 1: Rainbow Candy Fams Company Profile & Personal Branding Page */}
      {currentView === 'profile' && (
        <Suspense fallback={<PageLoadingFallback theme={currentTheme} />}>
          <RainbowProfilePage
            currentTheme={currentTheme}
            onNavigateToEvent={handleNavigateToEventList}
            onOpenAdmin={() => {
              window.location.hash = '/admin';
              setCurrentView('admin');
            }}
            onSelectTheme={(id) => setCurrentThemeId(id)}
            events={events}
          />
        </Suspense>
      )}

      {/* View 2: Event Catalog Page (Katalog Event) */}
      {currentView === 'events' && (
        <Suspense fallback={<PageLoadingFallback theme={currentTheme} />}>
          <EventListPage
            events={events}
            currentTheme={currentTheme}
            onSelectEvent={handleSelectEvent}
            onNavigateToProfile={handleNavigateToProfile}
            onGoToAdmin={() => {
              window.location.hash = '/admin';
              setCurrentView('admin');
            }}
          />
        </Suspense>
      )}

      {/* View 3: Specific Event Detail Page (activeEvent) */}
      {currentView === 'event-detail' && (
        <>
          {/* Header with navigation between Profile, Event Catalog, and event sections */}
          <Header
            currentTheme={currentTheme}
            onSelectTheme={(id) => setCurrentThemeId(id)}
            onOpenPosterModal={() => setIsPosterModalOpen(true)}
            onOpenTermsModal={() => setIsTermsModalOpen(true)}
            onNavigateToProfile={handleNavigateToProfile}
            onNavigateToEventsList={handleNavigateToEventList}
            eventTitle={activeEvent.title}
            isEventEnded={isEventEnded}
          />

          <main className="relative z-10">
            {/* If event is ended, showcase the winners prominently (Juara 1, 2, 3 tanpa point) */}
            {isEventEnded ? (
              <StaggeredSection index={0}>
                <Suspense fallback={<PageLoadingFallback theme={currentTheme} />}>
                  <EndedEventWinnerShowcase
                    event={activeEvent}
                    currentTheme={currentTheme}
                    onNavigateToEventList={handleNavigateToEventList}
                    onNavigateToProfile={handleNavigateToProfile}
                  />
                </Suspense>
              </StaggeredSection>
            ) : (
              /* If event is open/ongoing, render the Hero Section with countdown and quick CTA */
              <StaggeredSection index={0}>
                <HeroSection
                  currentTheme={currentTheme}
                  event={activeEvent}
                  onRegisterClick={() => {
                    const el = document.getElementById('daftar');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onOpenPosterModal={() => setIsPosterModalOpen(true)}
                  onOpenTermsModal={() => setIsTermsModalOpen(true)}
                />
              </StaggeredSection>
            )}

            {/* 2. Prize Showcase: Cards for Juara 1, 2, 3 */}
            <StaggeredSection index={1}>
              <PrizeShowcase
                currentTheme={currentTheme}
                customPrizes={activePrizesFormatted}
              />
            </StaggeredSection>

            {/* 3. Interactive Registration Section (Locked if event is ended) */}
            <StaggeredSection index={2}>
              <RegistrationSection
                currentTheme={currentTheme}
                eventId={activeEvent.id}
                eventTitle={activeEvent.title}
                isEventEnded={isEventEnded}
                onRegistrationSuccess={handleNewRegistration}
                onOpenTermsModal={() => setIsTermsModalOpen(true)}
              />
            </StaggeredSection>

            {/* 4. Live Participant Board (Leaderboard for this specific event) */}
            <StaggeredSection index={3}>
              <LiveParticipantBoard
                currentTheme={currentTheme}
                participants={activeEventParticipants}
                isLoading={isLoadingParticipants}
                onRefresh={loadParticipantsData}
                isRealtimeActive={isRealtimeActive}
              />
            </StaggeredSection>

            {/* 5. Event Details & Assessment Criteria */}
            <StaggeredSection index={4}>
              <EventDetailsSection
                currentTheme={currentTheme}
                event={activeEvent}
                onOpenTermsModal={() => setIsTermsModalOpen(true)}
              />
            </StaggeredSection>
          </main>

          {/* 6. Footer */}
          <StaggeredSection index={5}>
            <Footer
              currentTheme={currentTheme}
              onOpenPosterModal={() => setIsPosterModalOpen(true)}
              onOpenTermsModal={() => setIsTermsModalOpen(true)}
              onNavigateToProfile={handleNavigateToProfile}
              onOpenAdmin={() => {
                window.location.hash = '/admin';
                setCurrentView('admin');
              }}
            />
          </StaggeredSection>
        </>
      )}

      {/* 7. Floating Theme Switcher Control (Persistent across all public views) */}
      <ThemeSwitcher
        currentTheme={currentTheme}
        onSelectTheme={(id) => setCurrentThemeId(id)}
      />

      {/* 8. Background Audio Player: PERSISTENT across profile, events, and event-detail views! */}
      {/* Kept mounted continuously in the tree so music never restarts on view changes */}
      <BackgroundAudioPlayer
        currentTheme={currentTheme}
        currentThemeId={currentThemeId}
      />

      {/* 9. Official Event Poster Preview & Download Modal */}
      {isPosterModalOpen && (
        <Suspense fallback={null}>
          <EventPosterModal
            isOpen={isPosterModalOpen}
            onClose={() => setIsPosterModalOpen(false)}
            currentTheme={currentTheme}
          />
        </Suspense>
      )}

      {/* 10. Official Syarat & Ketentuan (S&K) Modal */}
      {isTermsModalOpen && (
        <Suspense fallback={null}>
          <TermsModal
            isOpen={isTermsModalOpen}
            onClose={() => setIsTermsModalOpen(false)}
            currentTheme={currentTheme}
            onRegisterClick={() => {
              if (isEventEnded) return;
              const el = document.getElementById('daftar');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default App;
