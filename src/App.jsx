import React from 'react';
import { useSystem } from './context/SystemContext';
import LoginScreen from './components/LoginScreen';
import Navbar from './components/layout/Navbar';
import EquipmentCard from './components/dashboard/EquipmentCard';

// Importación de Modales
import CajaModal from './components/modals/CajaModal';
import ConfigModal from './components/modals/ConfigModal';
import HistorialModal from './components/modals/HistorialModal';
import EstacionesModal from './components/modals/EstacionesModal';
import InventarioModal from './components/modals/InventarioModal';
import ClientesModal from './components/modals/ClientesModal';
import UsuariosModal from './components/modals/UsuariosModal';
import BackupModal from './components/modals/BackupModal';
import CobrarModal from './components/modals/CobrarModal';
import CambiarPinModal from './components/modals/CambiarPinModal';
import PrepagoModal from './components/modals/PrepagoModal';
import IntercambioModal from './components/modals/IntercambioModal';
import ProductosModal from './components/modals/ProductosModal';
import ConfirmarResetModal from './components/modals/ConfirmarResetModal';
import LegalModal from './components/modals/LegalModal';
import VentaDirectaModal from './components/modals/VentaDirectaModal';
import LogoutModal from './components/modals/LogoutModal';

// Iconos para Toasts
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Move, LogOut } from 'lucide-react';

function AppContent() {
    const { usuarioActual, setUsuarioActual, equipos, modalAbierto, setModalAbierto, toasts, removeToast, modoEdicion, reordenarEquipos } = useSystem();
    const [draggedIndex, setDraggedIndex] = React.useState(null);

    // Log de verificación de carga
    console.log("FasTPV App iniciada correctamente");

    // Si no hay usuario logueado, mostrar pantalla de Login
    if (!usuarioActual) return <LoginScreen />;

    // Handlers para Drag & Drop
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        // Efecto visual opcional
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnter = (index) => {
        if (draggedIndex === null || draggedIndex === index) return;
        reordenarEquipos(draggedIndex, index);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <div className="min-h-screen bg-[#f2f2f7] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-10 transition-colors duration-300">
            <Navbar />
            
            <main className="max-w-7xl mx-auto px-4 py-6">
                {modoEdicion && (
                    <div className="mb-4 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                        <Move size={16} /> Modo Diseño Activo: Arrastra las estaciones para reordenarlas a tu gusto.
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {equipos.map((eq, index) => (
                        <div 
                            key={eq.id}
                            draggable={modoEdicion}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className={`transition-all duration-200 rounded-2xl ${modoEdicion ? 'cursor-move ring-2 ring-dashed ring-amber-400 bg-amber-50/50 dark:bg-amber-900/10 scale-[0.98]' : ''} ${draggedIndex === index ? 'opacity-40' : ''}`}
                        >
                            <div className={modoEdicion ? 'pointer-events-none' : ''}>
                                <EquipmentCard equipo={eq} />
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <footer className="text-center py-8 text-slate-400 text-xs">
                <p>&copy; {new Date().getFullYear()} FasTPV. Todos los derechos reservados.</p>
            </footer>

            {/* Botón Flotante Info/Legal */}
            <button 
                onClick={() => setModalAbierto('legal')} 
                className="fixed bottom-4 left-4 z-40 p-3 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur text-slate-400 hover:text-cyan-500 shadow-lg border border-slate-200/50 dark:border-slate-700/50 transition-all hover:scale-110 hover:shadow-cyan-500/20"
                title="Información y Legal"
            >
                <Info size={20} />
            </button>

            {/* Botón Flotante Logout */}
            <button 
                onClick={() => setModalAbierto('logout_confirm')} 
                className="fixed bottom-4 right-4 z-40 p-3 rounded-full bg-rose-500/80 dark:bg-rose-600/80 backdrop-blur text-white shadow-lg border border-rose-400/50 transition-all hover:scale-110 hover:shadow-rose-500/30"
                title="Cerrar Sesión"
            >
                <LogOut size={20} />
            </button>

            {/* --- RENDERIZADO DE MODALES --- */}
            {/* Usamos renderizado condicional para montar/desmontar componentes y evitar errores de hooks */}
            {modalAbierto === 'caja' && <CajaModal />}
            {['config', 'config_precios', 'config_ticket'].includes(modalAbierto) && <ConfigModal />}
            {modalAbierto === 'historial' && <HistorialModal />}
            {modalAbierto === 'estaciones' && <EstacionesModal />}
            {modalAbierto === 'inventario' && <InventarioModal />}
            {modalAbierto === 'clientes' && <ClientesModal />}
            {modalAbierto === 'usuarios' && <UsuariosModal />}
            {modalAbierto === 'backup' && <BackupModal />}
            {modalAbierto === 'cobrar' && <CobrarModal />}
            {modalAbierto === 'cambiar_pin' && <CambiarPinModal />}
            {modalAbierto === 'prepago' && <PrepagoModal />}
            {modalAbierto === 'intercambio' && <IntercambioModal />}
            {modalAbierto === 'productos' && <ProductosModal />}
            {modalAbierto === 'reset' && <ConfirmarResetModal />}
            {modalAbierto === 'legal' && <LegalModal />}
            {modalAbierto === 'venta_directa' && <VentaDirectaModal />}
            {modalAbierto === 'logout_confirm' && <LogoutModal />}
            
            {/* --- SISTEMA DE NOTIFICACIONES (TOASTS) --- */}
            <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto w-80 bg-white dark:bg-slate-800 shadow-2xl rounded-xl p-4 flex items-start gap-3 border-l-4 transition-all modal-anim ${
                        t.type === 'success' ? 'border-emerald-500' : 
                        t.type === 'error' ? 'border-rose-500' : 
                        t.type === 'warning' ? 'border-amber-500' : 'border-blue-500'
                    }`}>
                        <div className={`mt-0.5 ${
                            t.type === 'success' ? 'text-emerald-500' : 
                            t.type === 'error' ? 'text-rose-500' : 
                            t.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                        }`}>
                            {t.type === 'success' ? <CheckCircle size={20}/> : 
                             t.type === 'error' ? <AlertCircle size={20}/> : 
                             t.type === 'warning' ? <AlertTriangle size={20}/> : <Info size={20}/>}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800 dark:text-white mb-0.5 capitalize">
                                {t.type === 'info' ? 'Información' : t.type === 'error' ? 'Error' : t.type === 'warning' ? 'Advertencia' : 'Éxito'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">{t.msg}</p>
                        </div>
                        <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <X size={16}/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function App() {
    return <AppContent />;
}
