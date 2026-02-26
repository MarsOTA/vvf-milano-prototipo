
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StaffView } from './components/StaffView';
import { TemplateCreator } from './components/TemplateCreator';
import { OlympicGenerator } from './components/OlympicGenerator';
import { LoginScreen } from './components/LoginScreen';
import { ScreenType, UserRole, OperationalEvent, Operator } from './types';
import { MOCK_EVENTS, MOCK_OPERATORS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('vvf_auth') === 'true';
  });
  const [activeScreen, setActiveScreen] = useState<ScreenType>('DASHBOARD');
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem('vvf_role') as UserRole) || 'COMPILATORE_A';
  });
  const [currentDate, setCurrentDate] = useState('');
  const [operators, setOperators] = useState<Operator[]>(() => {
    try {
      const saved = localStorage.getItem('vvf_operators');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error loading operators from localStorage", e);
    }
    return MOCK_OPERATORS;
  });
  const [events, setEvents] = useState<OperationalEvent[]>(() => {
    try {
      const saved = localStorage.getItem('vvf_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error loading events from localStorage", e);
    }
    return MOCK_EVENTS;
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    try {
      return localStorage.getItem('vvf_selected_date') || '2026-02-17';
    } catch (e) {
      return '2026-02-17';
    }
  });
  const [editingEvent, setEditingEvent] = useState<OperationalEvent | null>(null);

  useEffect(() => {
    localStorage.setItem('vvf_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('vvf_operators', JSON.stringify(operators));
  }, [operators]);

  useEffect(() => {
    localStorage.setItem('vvf_auth', isAuthenticated.toString());
    localStorage.setItem('vvf_role', currentRole);
  }, [isAuthenticated, currentRole]);

  useEffect(() => {
    localStorage.setItem('vvf_selected_date', selectedDate);
  }, [selectedDate]);

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
    setActiveScreen('DASHBOARD');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveScreen('DASHBOARD');
    setEditingEvent(null);
  };

  const handleSaveEvent = (newEvent: OperationalEvent) => {
    if (editingEvent) {
      setEvents(prev => prev.map(ev => ev.id === newEvent.id ? newEvent : ev));
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
            setOperators={setOperators}
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
