import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { generarTicket } from '../../utils/ticketGenerator';
import { Timer, X, Play } from 'lucide-react';
import { generarFolio } from '../../utils/folioGenerator';

export default function PrepagoModal() {
    const { 
        modalAbierto, setModalAbierto, 
        equipoSeleccionadoId, 
        equipos, setEquipos, 
        ventas,
        setVentas, 
        usuarioActual, 
        config, 
        addToast, 
        playSound 
    } = useSystem();

    const [prepagoData, setPrepagoData] = useState({ dinero: '', minutos: '' });

    if (modalAbierto !== 'prepago' || !equipoSeleccionadoId) return null;

    const eqSel = equipos.find(e => e.id === equipoSeleccionadoId);
    if (!eqSel) return null;

    const aplicarPrepago = () => {
        let ms = 0;
        let totalCobrado = 0;

        if (prepagoData.dinero) {
            totalCobrado = parseFloat(prepagoData.dinero);
            ms = (totalCobrado / eqSel.precioHora) * 3600000;
        } else if (prepagoData.minutos) {
            const mins = parseInt(prepagoData.minutos);
            ms = mins * 60000;
            totalCobrado = (mins / 60) * eqSel.precioHora;
        }

        if (ms > 0) { 
            setEquipos(prev => prev.map(e => e.id === eqSel.id ? { ...e, estado: 'ocupado', inicio: Date.now(), modo: 'prepago', limiteTiempo: ms, tiempoAcumulado: 0, alertaMinuto: false } : e)); 
            
            const nuevoFolio = generarFolio(config, ventas);

            // Generar Ticket y Venta de inmediato (Cobro Anticipado)
            const venta = { 
                id: Date.now(), 
                folio: nuevoFolio,
                fecha: new Date().toISOString(), 
                equipo: eqSel.nombre, 
                cliente: "Público General", 
                total: totalCobrado, 
                puntosGanados: 0, 
                productos: [{ nombre: `Renta Prepago (${(ms/60000).toFixed(0)} min)`, precio: totalCobrado, cantidad: 1 }], 
                subtotalRenta: 0, // Se pone en productos para descripción clara
                pagoCon: totalCobrado, 
                cambio: 0,
                atendio: usuarioActual.nombre,
                cancelada: false
            };
            
            setVentas(prev => [...prev, venta]);
            generarTicket(venta, config);
            playSound('success');
            setModalAbierto(null); 
        } 
        else {
            addToast("Datos inválidos", 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-500/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-anim">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden modal-anim border border-white/20 dark:border-slate-700">
                <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                    <h2 className="font-bold flex gap-2 items-center"><Timer/> Prepago</h2>
                    <button onClick={() => setModalAbierto(null)} className="p-1 rounded-full hover:bg-indigo-700 transition-colors"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4 bg-white dark:bg-slate-900">
                    <div className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Configurando: <span className="font-bold text-slate-800 dark:text-white">{eqSel.nombre}</span><br/>
                        Tarifa: ${eqSel.precioHora}/hr
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        {[30, 60, 90].map(m => (
                            <button key={m} onClick={() => setPrepagoData({ minutos: m, dinero: '' })} className={`py-2 rounded-lg border text-xs font-bold transition-all ${prepagoData.minutos == m ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                {m} Min<br/>
                                <span className="font-normal opacity-70">${((m/60)*eqSel.precioHora).toFixed(2)}</span>
                            </button>
                        ))}
                    </div>

                    <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Por Dinero ($)</label><div className="relative"><span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span><input type="number" className="w-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 pl-8 focus:border-indigo-500 outline-none font-bold text-lg dark:text-white transition-all" placeholder="0.00" value={prepagoData.dinero} onChange={e => setPrepagoData({ dinero: e.target.value, minutos: '' })} autoFocus /></div>{prepagoData.dinero && <p className="text-right text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">= {((parseFloat(prepagoData.dinero) / eqSel.precioHora) * 60).toFixed(0)} min</p>}</div>
                    <div className="flex items-center gap-2"><div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div><span className="text-xs text-slate-400">O BIEN</span><div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div></div>
                    <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Por Tiempo (Minutos)</label><input type="number" className="w-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 focus:border-indigo-500 outline-none text-center dark:text-white transition-all" placeholder="Ej. 30" value={prepagoData.minutos} onChange={e => setPrepagoData({ minutos: e.target.value, dinero: '' })} /></div>
                    <button onClick={aplicarPrepago} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-lg mt-4 flex justify-center items-center gap-2 transition-all"><Play size={18}/> Iniciar</button>
                </div>
            </div>
        </div>
    );
}