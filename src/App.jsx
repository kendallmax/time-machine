import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login';
import Dashboard from './Dashboard';
import ResetPassword from './ResetPassword';
import { Loader2 } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    // Get the initial active session on component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsCheckingSession(false);
    });

    // Listen to changes in auth state (login, logout, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setIsCheckingSession(false);
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleNavigation = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handleNavigation);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

  const navigateToLogin = () => {
    window.history.replaceState({}, '', '/');
    setPathname('/');
  };

  // Display a premium loading spinner while resolving session state
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-slate-100 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring */}
            <div className="absolute w-14 h-14 bg-purple-500/10 rounded-full border border-purple-500/20 animate-ping" />
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin relative z-10" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-sm font-semibold text-white">Time Machine</h2>
            <p className="text-xs text-slate-500">Iniciando aplicación...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {pathname === '/reset-password' ? (
        <ResetPassword onBackToLogin={navigateToLogin} />
      ) : !session ? (
        <Login />
      ) : (
        <Dashboard user={session.user} />
      )}
    </>
  );
}

export default App;
