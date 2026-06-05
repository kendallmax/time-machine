import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { 
  LogOut, 
  MapPin, 
  Globe, 
  Clock, 
  CheckCircle, 
  Loader2, 
  User, 
  Navigation,
  FileText,
  Building,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState('entrada'); // 'entrada' or 'salida'
  const [location, setLocation] = useState('Oficina Central');
  const [customDescription, setCustomDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState(''); // Tracking GPS, IP, Saving...
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [lastSavedRecord, setLastSavedRecord] = useState(null);

  // Get user name and last name from metadata, fall back to email prefix
  const displayName = user?.user_metadata?.nombre
    ? `${user.user_metadata.nombre} ${user.user_metadata.apellidos || ''}`.trim()
    : user?.email?.split('@')[0];

  // Predefined locations
  const locations = [
    'Oficina Central',
    'Cliente A',
    'Sucursal Sur',
    'Otro'
  ];

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      alert('Error al cerrar sesión: ' + error.message);
    }
  };

  // Main logic to register check-in or check-out
  const handleRegisterAttendance = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setStatusText('Obteniendo GPS...');

    try {
      // 1. Get Geolocation coordinates
      const coords = await getGPSCoordinates();
      
      // 2. Fetch Public IP
      setStatusText('Consultando IP pública...');
      const ipAddress = await getPublicIP();

      // 3. Save to Supabase
      setStatusText('Registrando en base de datos...');
      const finalLocation = activeTab === 'entrada' ? location : 'Salida';
      const finalDescription = activeTab === 'entrada' && location === 'Otro' ? customDescription : '';

      const attendanceData = {
        user_id: user.id,
        tipo: activeTab,
        ubicacion: finalLocation,
        descripcion: finalDescription || null,
        latitud: coords.latitude,
        longitud: coords.longitude,
        ip: ipAddress
      };

      const { data, error } = await supabase
        .from('asistencias')
        .insert([attendanceData])
        .select();

      if (error) throw error;

      // 4. Trigger Success Overlay
      setLastSavedRecord({
        tipo: activeTab,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ubicacion: finalLocation
      });
      
      setShowSuccessOverlay(true);
      
      // Auto-hide success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessOverlay(false);
      }, 3000);

      // Reset fields if check-in
      if (activeTab === 'entrada') {
        setLocation('Oficina Central');
        setCustomDescription('');
      }

    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || 'Ocurrió un error inesperado al registrar.');
    } finally {
      setIsLoading(false);
      setStatusText('');
    }
  };

  // Helper promise for Geolocation
  const getGPSCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La geolocalización no es soportada por este navegador.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          let msg = 'Error de GPS desconocido.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              msg = 'Permiso de ubicación denegado. Por favor, actívalo en los ajustes de tu celular.';
              break;
            case error.POSITION_UNAVAILABLE:
              msg = 'Información de ubicación no disponible.';
              break;
            case error.TIMEOUT:
              msg = 'Tiempo de espera agotado al obtener ubicación.';
              break;
          }
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  };

  // Helper function to fetch Public IP
  const getPublicIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      if (!response.ok) throw new Error();
      const data = await response.json();
      return data.ip;
    } catch (e) {
      console.warn('Could not fetch IP from ipify, using fallback.');
      return '127.0.0.1'; // local fallback if offline or request blocked
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-purple-500/10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Asistencia</div>
            <div className="text-sm font-semibold text-white max-w-[140px] xs:max-w-[180px] truncate">
              {displayName}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-1 bg-slate-800 rounded-full py-1 px-3 border border-slate-700 text-xs text-slate-300">
            <User className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{displayName}</span>
          </div>

          <button 
            onClick={handleSignOut}
            aria-label="Cerrar sesión"
            className="flex items-center space-x-1 bg-red-950/40 hover:bg-red-900/30 text-red-300 border border-red-900/40 rounded-xl p-2 sm:px-3 sm:py-2 text-xs font-semibold transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col p-4 max-w-md w-full mx-auto justify-center space-y-6">
        
        {/* Date/Time Live Dashboard Widget */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 text-center shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-slate-800/10 pointer-events-none">
            <Clock className="w-28 h-28" />
          </div>
          
          <ClockWidget />
        </div>

        {/* Attendance Register Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col relative">
          
          {/* Tabs header */}
          <div className="flex border-b border-slate-800 bg-slate-900/50 p-2">
            <button
              onClick={() => {
                if (!isLoading) {
                  setActiveTab('entrada');
                  setErrorMsg('');
                }
              }}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === 'entrada'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Navigation className="w-4 h-4 rotate-45" />
              <span>Marcar Entrada</span>
            </button>
            <button
              onClick={() => {
                if (!isLoading) {
                  setActiveTab('salida');
                  setErrorMsg('');
                }
              }}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === 'salida'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LogOut className="w-4 h-4 transform rotate-180" />
              <span>Marcar Salida</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-5">
            
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-red-950/40 border border-red-900/50 flex items-start space-x-2 text-red-200 text-sm animate-fadeIn">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {activeTab === 'entrada' ? (
              // CHECK-IN FLOW
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-2">
                  <label htmlFor="location-select" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Ubicación de Entrada
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-5 h-5" />
                    </div>
                    <select
                      id="location-select"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none text-base cursor-pointer disabled:opacity-50"
                    >
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {location === 'Otro' && (
                  <div className="space-y-2 animate-slideDown">
                    <label htmlFor="custom-location-description" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Descripción del Lugar
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3.5 text-slate-400 pointer-events-none">
                        <FileText className="w-5 h-5" />
                      </div>
                      <textarea
                        id="custom-location-description"
                        rows="2"
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder="Ej. Casa cliente final, Cafetería X..."
                        disabled={isLoading}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base disabled:opacity-50"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // CHECK-OUT FLOW
              <div className="text-center py-4 space-y-2 animate-fadeIn">
                <p className="text-slate-300 text-sm font-medium">
                  ¿Listo para finalizar tu jornada de trabajo?
                </p>
                <p className="text-xs text-slate-500">
                  Capturaremos tus coordenadas GPS e IP para registrar tu salida oficial.
                </p>
              </div>
            )}

            {/* Confirm Action Button */}
            <button
              onClick={handleRegisterAttendance}
              disabled={isLoading || (activeTab === 'entrada' && location === 'Otro' && !customDescription.trim())}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-base select-none mt-4 ${
                activeTab === 'entrada'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/10'
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/10'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-semibold text-slate-200">{statusText}</span>
                </div>
              ) : (
                <>
                  <span>{activeTab === 'entrada' ? 'Confirmar Entrada' : 'Confirmar Salida'}</span>
                  {activeTab === 'entrada' ? <CheckCircle className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                </>
              )}
            </button>

          </div>
        </div>

        {/* Instructions Footer Card */}
        <div className="text-center text-slate-500 text-xs space-y-1">
          <p>La aplicación requiere permisos de geolocalización.</p>
          <p>© {new Date().getFullYear()} Time Machine. Todos los derechos reservados.</p>
        </div>
      </main>

      {/* SUCCESS OVERLAY MODAL */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl flex flex-col items-center space-y-4 animate-scaleUp">
            
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Registro Guardado</h3>
              <p className="text-sm text-slate-400">
                ¡Tu {lastSavedRecord?.tipo} ha sido procesada!
              </p>
            </div>

            <div className="w-full bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Tipo:</span>
                <span className={`font-semibold capitalize ${lastSavedRecord?.tipo === 'entrada' ? 'text-purple-400' : 'text-indigo-400'}`}>
                  {lastSavedRecord?.tipo}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Hora:</span>
                <span className="font-semibold text-slate-300">{lastSavedRecord?.hora}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Lugar:</span>
                <span className="font-semibold text-slate-300 truncate max-w-[150px]">{lastSavedRecord?.ubicacion}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500">
              Esta ventana se cerrará automáticamente en breve...
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

// Subcomponent to handle local clock updates
function ClockWidget() {
  const [time, setTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = time.toLocaleDateString('es-ES', options);

  return (
    <div className="relative z-10 flex flex-col items-center">
      <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-1.5 flex items-center space-x-1">
        <Globe className="w-3 h-3 text-purple-400 animate-spin-slow" />
        <span>Hora Oficial</span>
      </span>
      <h2 className="text-4xl font-extrabold text-white tracking-wider select-none tabular-nums">
        {formattedTime}
      </h2>
      <p className="text-slate-400 text-xs font-medium capitalize mt-1.5">
        {formattedDate}
      </p>
    </div>
  );
}
