import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StaffView } from './components/StaffView';
import { TemplateCreator } from './components/TemplateCreator';
import { OlympicGenerator } from './components/OlympicGenerator';
import { LoginScreen } from './components/LoginScreen';
import { ScreenType, UserRole, OperationalEvent, Operator } from './types';
import { MOCK_EVENTS, MOCK_OPERATORS } from './constants';
import {
  loadEvents,
  saveEvents,
  loadOperators,
  saveOperators,
  loadSession,
  saveSession,
  clearSession,
  loadSelectedDate,
  saveSelectedDate,
} from './utils/storage';

const App: React.FC = () => {
  const session = loadSession();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!session);
  const [activeScreen, setActiveScreen] = useState<ScreenType>('DASHBOARD');
  const [currentRole, setCurrentRole] = useState<UserRole>(() => session?.role || 'COMPILATORE_A');

  const [currentDate, setCurrentDate] = useState('');

  // Dati principali persistenti (LocalStorage)
  const [events, setEvents] = useState<OperationalEvent[]>(() => loadEvents(MOCK_EVENTS));
  const [operators, setOperators] = useState<Operator[]>(() => loadOperators(MOCK_OPERATORS));

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const evs = loadEvents(MOCK_EVENTS);
    const fallback = evs[0]?.date || new Date().toISOString().split('T')[0];
    return loadSelectedDate(fallback);
  });

  const [editingEvent, setEditingEvent] = useState<OperationalEvent | null>(null);

  // Persistenza eventi/operatori/selectedDate
  useEffect(() => {
    saveEvents(events);
  }, [events]);

  useEffect(() => {
    saveOperators(operators);
  }, [operators]);

  useEffect(() => {
    saveSelectedDate(selectedDate);
  }, [selectedDate]);

  // Persistenza sessione (ruolo)
  useEffect(() => {
    if (isAuthenticated) saveSession(currentRole);
  }, [currentRole, isAuthenticated]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const dayName = now.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase();
      const time = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      setCurrentDate(`${dayName} ${formatted} • ${time}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (role: UserRole) => {
    setCurrentRole(role);
    setIsAuthenticated(true);
    saveSession(role);
    setActiveScreen('DASHBOARD');
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
    setActiveScreen('DASHBOARD');
    setEditingEvent(null);
  };

  const handleSaveEvent = (newEvent: OperationalEvent) => {
    if (editingEvent) {
      setEvents(prev => prev.map(ev => (ev.id === newEvent.id ? newEvent : ev)));
    } else {
      setEvents(prev => [newEvent, ...prev]);
    }
    setSelectedDate(newEvent.date);
    setActiveScreen('DASHBOARD');
    setEditingEvent(null);
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
    setActiveScreen('DASHBOARD');
  };

  const handleStartEdit = (event: OperationalEvent) => {
    setEditingEvent(event);
    setActiveScreen('CREAZIONE');
  };

  const handleNavigateToCreate = () => {
    setEditingEvent(null);
    setActiveScreen('CREAZIONE');
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-full w-full font-sans antialiased text-slate-700">
      <Layout
        activeScreen={activeScreen}
        setScreen={(s) => {
          if (s === 'CREAZIONE') handleNavigateToCreate();
          else setActiveScreen(s);
        }}
        role={currentRole}
        setRole={setCurrentRole}
        onLogout={handleLogout}
        date={currentDate}
        events={events}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      >
        {activeScreen === 'DASHBOARD' && (
          <Dashboard
            events={events}
            setEvents={setEvents}
            operators={operators}
            role={currentRole}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onEditEvent={handleStartEdit}
          />
        )}
        {activeScreen === 'STAFF' && (
          <StaffView
            events={events}
            operators={operators}
            setOperators={setOperators}
          />
        )}
        {activeScreen === 'CREAZIONE' && (
          <TemplateCreator
            onSave={handleSaveEvent}
            onCancel={handleCancelEdit}
            defaultDate={selectedDate}
            initialEvent={editingEvent || undefined}
          />
        )}
        {activeScreen === 'GENERATORE' && <OlympicGenerator />}
      </Layout>
    </div>
  );
};

export default App;
