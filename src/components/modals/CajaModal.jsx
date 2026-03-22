import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { generarReporteCaja } from '../../utils/ticketGenerator';
import { Wallet, X, ArrowRight, Coins } from 'lucide-react';

export default function CajaModal() {
    const { 
        caja, setCaja, 
        ventas, 
        setCortes, 
        usuarioActual, 
        setModalAbierto, 
        addToast,
        config
    } = useSystem();

    const [cajaForm, setCajaForm] = useState({ fondo: '' });
    const [arqueoForm, setArqueoForm] = useState({ contado: '' });

    const obtenerVentasTurno = () => {
        if (!caja.activa || !caja.inicio) return [];
        return ventas.filter(v => new Date(v.fecha) >= new Date(caja.inicio));
    };

    const abrirCaja = () => {
        if (!cajaForm.fondo) return addToast("Ingresa un fondo inicial", 'warning');
        setCaja({ activa: true, fondo: parseFloat(cajaForm.fondo), inicio: new Date().toISOString() });
        setCajaForm({ fondo: '' });
        addToast("Turno iniciado correctamente.", 'success');
    };

    const cerrarCaja = () => {
        if(window.confirm("¿Seguro que deseas cerrar el turno y hacer corte? Se generará el reporte PDF.")) {
            const ventasTurno = obtenerVentasTurno();
            const totalVentas = ventasTurno.reduce((acc, v) => acc + (v.cancelada ? 0 : v.total), 0);
            const totalEsperado = caja.fondo + totalVentas;
            const contado = parseFloat(arqueoForm.contado) || totalEsperado;
            
            const nuevoCorte = {
                id: Date.now(),
                fecha: new Date().toISOString(),
                inicio: caja.inicio,
                fondo: caja.fondo,
                totalVentas: totalVentas,
                totalCaja: totalEsperado,
                contado: contado,
                diferencia: contado - totalEsperado,
                usuario: usuarioActual.nombre,
                ventasSnapshot: ventasTurno
            };
            
            setCortes(prev => [nuevoCorte, ...prev]);
            generarReporteCaja({ ...caja, fechaCierre: new Date().toISOString(), contado, diferencia: contado - totalEsperado }, ventasTurno, usuarioActual, config);
            
            setCaja({ activa: false, fondo: 0, inicio: null });
            addToast("Turno cerrado. Reporte generado.", 'success');
            setModalAbierto(null);
        }
    };

    const ventasTurno = obtenerVentasTurno();
    const totalVentasTurno = ventasTurno.reduce((acc, v) => acc + (v.cancelada ? 0 : v.total), 0);
    const esperado = caja.fondo + totalVentasTurno;
    const diferencia = (parseFloat(arqueoForm.contado) || 0) - esperado;

    return (
        <div className="fixed inset-0 bg-slate-500/30 backdrop-blur-sm flex items-center justify-center z-[80] fade-anim">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden modal-anim border border-white/20 dark:border-slate-700/50">
                <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center shrink-0">
                    <h2 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        <Wallet className="text-blue-500"/> Control de Caja
                    </h2>
                    <button onClick={() => setModalAbierto(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={20} className="text-slate-500"/>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                {caja.activa ? (
                    <div className="p-6">
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 p-4 rounded-2xl text-center mb-4">
                            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-bold uppercase">Turno Activo Desde</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(caja.inicio).toLocaleString()}</p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                                <span className="text-slate-500 dark:text-slate-400">Fondo Inicial</span>
                                <span className="font-bold text-lg dark:text-white">${caja.fondo.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                                <span className="text-slate-500 dark:text-slate-400">Ventas Turno ({ventasTurno.length})</span>
                                <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">+${totalVentasTurno.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl">
                                <span className="text-slate-700 dark:text-slate-200 font-bold uppercase text-xs tracking-wider">Total Esperado</span>
                                <span className="font-black text-2xl text-slate-800 dark:text-white">${esperado.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Sección de Arqueo */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl mb-6">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Coins size={14} className="text-blue-500"/> Arqueo de Efectivo
                            </p>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                                <input 
                                    type="number" 
                                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl p-2 pl-8 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-300" 
                                    placeholder="0.00" 
                                    value={arqueoForm.contado}
                                    onChange={e => setArqueoForm({ contado: e.target.value })}
                                />
                            </div>
                            {arqueoForm.contado && (
                                <div className={`mt-3 flex justify-between items-center p-3 rounded-xl border animate-in slide-in-from-top-2 duration-300 ${
                                    diferencia === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 
                                    diferencia > 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 
                                    'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400'
                                }`}>
                                    <span className="text-xs font-bold uppercase">Diferencia:</span>
                                    <span className="font-black">${diferencia.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3">
                                <button onClick={cerrarCaja} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-rose-500/30 transition-all whitespace-nowrap">
                                    Cerrar Caja
                                </button>
                                <button onClick={() => setModalAbierto(null)} className="flex-[1.2] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 hover:ring-2 hover:ring-emerald-500 text-slate-700 dark:text-slate-200 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group">
                                    Continuar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 text-center px-4 leading-tight">
                                Al cerrar, se generará el reporte de corte y se reiniciará el contador de efectivo.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl mb-6 text-center border border-blue-100 dark:border-blue-800/50">
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">La caja está cerrada. Ingresa el fondo inicial para comenzar tu turno.</p>
                        </div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide ml-1">Monto Fondo Inicial</label>
                        <div className="relative mb-6">
                            <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                            <input 
                                type="number" 
                                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl p-3.5 pl-10 text-xl font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all" 
                                placeholder="0.00" 
                                value={cajaForm.fondo} 
                                onChange={e => setCajaForm({...cajaForm, fondo: e.target.value})} 
                                autoFocus 
                            />
                        </div>
                        <button onClick={abrirCaja} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
                            Iniciar Turno <ArrowRight size={20}/>
                        </button>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}