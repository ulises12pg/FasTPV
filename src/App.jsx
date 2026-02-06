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

// Iconos para Toasts
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

function AppContent() {
    const { usuarioActual, equipos, modalAbierto, toasts, removeToast } = useSystem();

    // Log de verificación de carga
    console.log("FasTPV App iniciada correctamente");

    // Si no hay usuario logueado, mostrar pantalla de Login
    if (!usuarioActual) return <LoginScreen />;

    return (
        <div className="min-h-screen bg-[#f2f2f7] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-10 transition-colors duration-300">
            <Navbar />
            
            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {equipos.map(eq => (
                        <EquipmentCard key={eq.id} equipo={eq} />
                    ))}
                </div>
            </main>

            <footer className="text-center py-8 text-slate-400 text-xs">
                <p>&copy; {new Date().getFullYear()} FasTPV. Todos los derechos reservados.</p>
            </footer>

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
