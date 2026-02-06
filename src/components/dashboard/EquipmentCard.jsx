import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { 
    Monitor, Gamepad2, Play, Pause, Timer, Lock, Bell, 
    Coffee, CircleDollarSign, ArrowRightLeft, RotateCcw 
} from 'lucide-react';

export default function EquipmentCard({ equipo }) {
    const { 
        setEquipos, 
        setModalAbierto, 
        setEquipoSeleccionadoId, 
        caja, 
        config, 
        addToast, 
        playSound 
    } = useSystem();

    // --- Lógica de Estado y Cálculos ---
    const calcularTiempo = (eq) => {
        if (!eq || eq.estado === 'libre') return 0;
        let t = eq.tiempoAcumulado;
        if (eq.estado === 'ocupado' && eq.inicio) t += (Date.now() - eq.inicio);
        return t;
    };

    const calcularTotalRenta = (eq) => {
        if (!eq || eq.tipo === 'DIRECTA') return 0;
        if (eq.modo === 'prepago') return 0;
        const tiempoMs = eq.estado === 'finalizado' ? eq.tiempoAcumulado : calcularTiempo(eq);
        const horas = tiempoMs / 3600000;
        const tarifa = parseFloat(eq.precioHora);
        let total = horas * tarifa;
        
        if (tiempoMs > 60000 && total < config.tarifaMinima) {
            return Math.round(config.tarifaMinima);
        }
        return Math.round(Math.max(total, 0));
    };

    const tiempoMs = calcularTiempo(equipo);
    const esPrepago = equipo.modo === 'prepago';
    const restante = equipo.limiteTiempo - tiempoMs;
    const alerta1Min = esPrepago && restante <= 60000 && restante > 0;
    const finalizado = equipo.estado === 'finalizado';

    // --- Acciones ---
    const verificarCaja = () => {
        if (!caja.activa) {
            playSound('warning');
            addToast("⚠️ DEBES INICIAR TURNO EN CAJA PRIMERO", 'warning');
            setModalAbierto('caja');
            return false;
        }
        return true;
    };

    const iniciarTiempoLibre = () => {
        if (!verificarCaja()) return;
        setEquipos(prev => prev.map(eq => eq.id === equipo.id ? { ...eq, estado: 'ocupado', inicio: Date.now(), modo: 'libre', limiteTiempo: 0, alertaMinuto: false } : eq));
    };

    const togglePausa = () => {
        if (!verificarCaja()) return;
        setEquipos(prev => prev.map(eq => {
            if (eq.id === equipo.id) {
                if (eq.estado === 'ocupado') return { ...eq, estado: 'pausado', tiempoAcumulado: eq.tiempoAcumulado + (Date.now() - eq.inicio), inicio: null };
                if (eq.estado === 'pausado') return { ...eq, estado: 'ocupado', inicio: Date.now() };
            }
            return eq;
        }));
    };

    const abrirModalAccion = (modal) => {
        if (!verificarCaja()) return;
        setEquipoSeleccionadoId(equipo.id);
        setModalAbierto(modal);
    };

    // --- Clases Dinámicas ---
    let cardClass = "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/60 dark:border-slate-700/60 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group";
    if (esPrepago && !finalizado && !alerta1Min) cardClass += " ring-2 ring-indigo-400 bg-indigo-50/40 dark:bg-indigo-900/10";
    if (alerta1Min) cardClass += " ring-2 ring-orange-400";
    if (finalizado) cardClass += " alarm-active ring-2 ring-rose-500";

    return (
        <div className={cardClass}>
            {/* Header */}
            <div className={`p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center ${equipo.estado === 'ocupado' ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : finalizado ? 'bg-rose-50/80 dark:bg-rose-900/20' : 'bg-transparent'}`}>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    {equipo.tipo === 'PC' ? <Monitor size={18} /> : <Gamepad2 size={18} />}
                    <span className="font-bold">{equipo.nombre}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${equipo.estado === 'libre' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>
                    {finalizado ? 'TIEMPO FINALIZADO' : equipo.estado}
                </span>
            </div>

            {/* Body */}
            <div className="p-4">
                <div className="text-center mb-4 relative">
                    {esPrepago && !finalizado && (
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div className={`h-full ${alerta1Min ? 'bg-orange-500' : 'bg-indigo-500'}`} style={{ width: `${Math.max(0, (restante / equipo.limiteTiempo) * 100)}%`, transition: 'width 1s linear' }}></div>
                        </div>
                    )}
                    <div className={`text-3xl font-mono ${finalizado ? 'text-rose-600 dark:text-rose-400 font-bold' : alerta1Min ? 'text-orange-500 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
                        {esPrepago && !finalizado ? new Date(Math.max(0, restante)).toISOString().substr(11, 8) : new Date(tiempoMs).toISOString().substr(11, 8) }
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">
                        {esPrepago ? (finalizado ? "SE REQUIERE COBRO" : "TIEMPO RESTANTE (PREPAGO)") : "TIEMPO TRANSCURRIDO"}
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm mb-4 bg-slate-50/80 dark:bg-slate-700/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-600">
                    <span className="text-slate-500 dark:text-slate-400">A Pagar:</span>
                    <span className="font-bold text-xl text-slate-800 dark:text-white">${(calcularTotalRenta(equipo) + equipo.cuenta.reduce((a,i)=>a+(i.precio * (i.cantidad || 1)),0)).toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {equipo.estado === 'libre' ? (
                        <>
                            <button onClick={iniciarTiempoLibre} className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 text-xs shadow-lg shadow-emerald-500/20 transition-all"><Play size={14}/> LIBRE</button>
                            <button onClick={() => abrirModalAccion('prepago')} className="col-span-2 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 text-xs shadow-lg shadow-blue-500/20 transition-all"><Timer size={14}/> PREPAGO</button>
                        </>
                    ) : (
                        <>
                            {!finalizado && !esPrepago && <button onClick={togglePausa} className={`col-span-2 py-2.5 rounded-xl text-white font-bold flex justify-center items-center shadow-md transition-all ${equipo.estado === 'ocupado' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>{equipo.estado === 'ocupado' ? <Pause size={16}/> : <Play size={16}/>}</button>}
                            {esPrepago && !finalizado && <div className="col-span-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-xl flex justify-center items-center text-xs font-bold border border-indigo-100 dark:border-indigo-800"><Lock size={12} className="mr-1"/> BLOQUEADO</div>}
                            {finalizado && <div className="col-span-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex justify-center items-center text-xs font-bold border border-rose-100 dark:border-rose-800 animate-pulse"><Bell size={12} className="mr-1"/> ¡COBRAR!</div>}
                            <button onClick={() => abrirModalAccion('productos')} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl flex justify-center items-center transition-colors"><Coffee size={18}/></button>
                            <button onClick={() => abrirModalAccion('cobrar')} disabled={esPrepago && !finalizado} className={`${esPrepago && !finalizado ? 'bg-slate-300 dark:bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transform active:scale-95'} rounded-xl flex justify-center items-center transition-all`} title="Cobrar"><CircleDollarSign size={18}/></button>
                            <button onClick={() => abrirModalAccion('intercambio')} className="col-span-2 mt-1 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 py-1.5 rounded-lg text-xs font-bold flex justify-center items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-blue-500 transition-colors"><ArrowRightLeft size={14}/> Mover</button>
                            <button onClick={() => abrirModalAccion('reset')} className="col-span-2 mt-1 bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-400 border border-slate-200 dark:border-slate-600 py-1.5 rounded-lg text-xs font-bold flex justify-center items-center gap-1 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><RotateCcw size={14} className="mr-1"/> Reset</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}