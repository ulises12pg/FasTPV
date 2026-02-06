import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { 
    Monitor, Wallet, Store, History, Settings, 
    UserCog, Package, Users, Shield, Key, Sun, Moon, LayoutGrid
} from 'lucide-react';
import { SISTEMA, COLOR_CORP } from '../../constants/initialData';

export default function Navbar() {
    const { 
        usuarioActual, setUsuarioActual, 
        config, 
        caja, 
        ventas, 
        setModalAbierto, 
        addToast, 
        playSound,
        darkMode, toggleDarkMode,
        modoEdicion, setModoEdicion
    } = useSystem();

    // Helper para verificar caja antes de permitir acciones de venta
    const verificarCaja = () => {
        if (!caja.activa) {
            playSound('warning');
            addToast("⚠️ DEBES INICIAR TURNO EN CAJA PRIMERO\nAntes de realizar cualquier operación, ingresa el fondo inicial.", 'warning');
            setModalAbierto('caja');
            return false;
        }
        return true;
    };

    const abrirVentaDirecta = () => {
        if (verificarCaja()) {
            setModalAbierto('venta_directa');
        }
    };

    // Calcular total en caja para mostrar en el botón (Fondo + Ventas del turno actual)
    const ventasTurno = caja.inicio ? ventas.filter(v => new Date(v.fecha) >= new Date(caja.inicio)) : [];
    const totalVentasTurno = ventasTurno.reduce((acc, v) => acc + (v.cancelada ? 0 : v.total), 0);
    const totalCaja = caja.fondo + totalVentasTurno;

    return (
        <nav className={`${COLOR_CORP} sticky top-0 z-20`}>
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo y Nombre */}
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-1.5 rounded-lg text-white shadow-lg shadow-blue-500/30">
                        <Monitor size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold leading-tight hidden md:block">{config.negocio?.nombre || "FasTPV"}</h1>
                        <p className="text-[10px] text-slate-400">{SISTEMA}</p>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                    {/* --- SECCIÓN 3 (Izquierda): Configuraciones y Modos --- */}
                    {usuarioActual?.rol === 'admin' && (
                        <button onClick={() => setModalAbierto('config')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 transition-colors" title="Configuración"><Settings size={20}/></button>
                    )}
                    
                    <button onClick={() => setModoEdicion(!modoEdicion)} className={`p-2 rounded-full transition-colors ${modoEdicion ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/50 animate-pulse' : 'hover:bg-slate-800 text-slate-400 hover:text-amber-400'}`} title="Modo Diseño (Reordenar Estaciones)"><LayoutGrid size={20} /></button>

                    <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-yellow-400 transition-colors" title={darkMode ? "Modo Claro" : "Modo Oscuro"}>
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {/* Separador 1 */}
                    <div className="h-6 w-px bg-slate-700 mx-1"></div>

                    {/* --- SECCIÓN 2 (Centro): Operatividad --- */}
                    {usuarioActual?.rol === 'admin' && (
                        <button onClick={() => setModalAbierto('estaciones')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-blue-400 transition-colors" title="Estaciones"><Monitor size={20}/></button>
                    )}
                    
                    <button onClick={() => setModalAbierto('clientes')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-pink-400 transition-colors" title="Clientes"><Users size={20}/></button>
                    
                    {usuarioActual?.rol === 'admin' && (
                        <button onClick={() => setModalAbierto('inventario')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-emerald-400 transition-colors" title="Inventario"><Package size={20}/></button>
                    )}
                    
                    <button 
                        onClick={abrirVentaDirecta} 
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-500/30 transition-all fade-anim"
                    >
                        <Store size={18} /> <span className="hidden sm:inline">Venta</span>
                    </button>

                    {/* Separador 2 */}
                    <div className="h-6 w-px bg-slate-700 mx-1"></div>

                    {/* --- SECCIÓN 1 (Derecha): Usuario y Caja --- */}
                    {usuarioActual?.rol === 'admin' && (
                        <button onClick={() => setModalAbierto('usuarios')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-indigo-400 transition-colors" title="Usuarios"><UserCog size={20}/></button>
                    )}

                    <div className="hidden md:flex items-center gap-2">
                        <div className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-xs flex items-center gap-2"><Shield size={12} className={usuarioActual?.rol === 'admin' ? 'text-blue-400' : 'text-slate-500'}/><span className="capitalize font-bold text-slate-300">{usuarioActual?.nombre}</span></div>
                        <button onClick={() => setModalAbierto('cambiar_pin')} className="bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full text-slate-400 hover:text-white transition-colors" title="Cambiar PIN"><Key size={12} /></button>
                    </div>
                    
                    <button onClick={() => setModalAbierto('historial')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all" title="Historial"><History size={18}/></button>

                    <button 
                        onClick={() => setModalAbierto('caja')} 
                        className={`px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm border transition-all ${caja.activa ? 'bg-emerald-500/20 text-emerald-400 border-emerald-800 hover:bg-emerald-600 hover:text-white' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'}`}
                    >
                        <Wallet size={18} /> 
                        <span className="hidden sm:inline">
                            {caja.activa ? `$${totalCaja.toFixed(2)}` : 'Caja'}
                        </span>
                    </button>
                </div>
            </div>
        </nav>
    );
}