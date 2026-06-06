import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, Lock, Eye, EyeOff, LogIn, KeyRound, Loader2, AlertCircle, CheckCircle2, UserPlus, User } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const appUrl = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, '');
  const resetPasswordUrl = `${appUrl}/reset-password`;
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle standard Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setSuccessMsg('¡Inicio de sesión exitoso!');
      if (onLoginSuccess && data.user) {
        onLoginSuccess(data.user);
      }
    } catch (error) {
      setErrorMsg(error.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle User Registration (Sign Up) with User Metadata
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !nombre || !apellidos) {
      setErrorMsg('Por favor, completa todos los campos.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: appUrl,
          data: {
            nombre: nombre.trim(),
            apellidos: apellidos.trim(),
          }
        }
      });

      if (error) throw error;

      // In Supabase, if email confirmation is disabled, session is returned immediately.
      if (data?.user && data?.session) {
        setSuccessMsg('¡Registro exitoso! Iniciando sesión...');
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      } else {
        setSuccessMsg('¡Registro exitoso! Se ha enviado un correo de confirmación. Por favor verifica tu bandeja de entrada antes de iniciar sesión.');
        setAuthMode('login');
        setPassword('');
        setConfirmPassword('');
        setNombre('');
        setApellidos('');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Error al registrar el usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset Request
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Por favor, ingresa tu correo para recuperar la contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetPasswordUrl,
      });

      if (error) throw error;

      setSuccessMsg('Enlace de recuperación enviado a tu correo.');
      setAuthMode('login');
    } catch (error) {
      setErrorMsg(error.message || 'Error al enviar el correo de recuperación.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
    setNombre('');
    setApellidos('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950">
      
      {/* Container Card with Glassmorphism */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300">
        
        {/* Decorative ambient blobs */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-3 animate-pulse-slow">
            {/* Clean SVG Logo representing Time and Location */}
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Time Machine</h1>
          <p className="text-xs text-slate-400 mt-1">Control de Asistencia</p>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start space-x-2 text-red-200 text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start space-x-2 text-emerald-200 text-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Forms depending on Auth Mode */}
        {authMode === 'login' && (
          // LOGIN FORM
          <form onSubmit={handleLogin} className="space-y-5 relative">
            <div>
              <label htmlFor="email-login" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email-login"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password-login" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
                >
                  ¿La olvidaste?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password-login"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl py-3 pl-11 pr-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] text-white font-semibold rounded-xl py-3.5 px-4 shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 text-base"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <LogIn className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="text-center pt-3 border-t border-slate-800">
              <p className="text-sm text-slate-400">
                ¿No tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </form>
        )}

        {authMode === 'register' && (
          // SIGN UP / REGISTER FORM
          <form onSubmit={handleRegister} className="space-y-4 relative animate-fadeIn">
            <div className="text-center mb-1">
              <h2 className="text-lg font-medium text-white">Crear Nueva Cuenta</h2>
              <p className="text-xs text-slate-400 mt-0.5">Regístrate para empezar a marcar asistencia</p>
            </div>

            {/* First Name & Last Name in same row on tablet, stacked on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre-register" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Nombre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="nombre-register"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Juan"
                    className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="apellidos-register" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Apellidos
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="apellidos-register"
                    type="text"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Pérez Gómez"
                    className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email-register" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email-register"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-register" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password-register"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl py-3 pl-11 pr-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password-register" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="confirm-password-register"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl py-3 pl-11 pr-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl py-3.5 px-4 shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 text-base"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Crear Cuenta</span>
                  <UserPlus className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="text-center pt-3 border-t border-slate-800">
              <p className="text-sm text-slate-400">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </div>
          </form>
        )}

        {authMode === 'reset' && (
          // PASSWORD RESET FORM
          <form onSubmit={handlePasswordReset} className="space-y-5 relative animate-fadeIn">
            <div className="text-center mb-2">
              <h2 className="text-lg font-medium text-white">Recuperar Contraseña</h2>
              <p className="text-xs text-slate-400 mt-1">
                Ingresa tu correo y te enviaremos un enlace de recuperación.
              </p>
            </div>

            <div>
              <label htmlFor="email-reset" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email-reset"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col space-y-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl py-3.5 px-4 shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:pointer-events-none text-base"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Enviar Enlace</span>
                    <KeyRound className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                disabled={isLoading}
                className="w-full bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border border-slate-700 rounded-xl py-3 text-sm font-medium transition-all"
              >
                Volver al Login
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
