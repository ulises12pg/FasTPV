import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { ArrowRightLeft, Monitor, Gamepad2 } from 'lucide-react';

export default function IntercambioModal() {
    const { 
        modalAbierto, setModalAbierto, 
        equipoSeleccionadoId, 
        equipos, setEquipos 
    } = useSystem();

    if (modalAbierto !== 'intercambio' || !equipoSeleccionadoId) return null;

    const eqSel = equipos.find(e => e.id === equipoSeleccionadoId);
    if (!eqSel) return null;

    const confirmarIntercambio = (idDestino) => {
        setEquipos(prev => {
            const origen = prev.find(e => e.id === equipoSeleccionadoId);
            const destino = prev.find(e => e.id === idDestino);
            if(!origen || !destino) return prev;
            
            // Calcular tiempo acumulado actual para transferirlo exacto
            let tiempo = origen.tiempoAcumulado;
            if (origen.estado === 'ocupado' && origen.inicio) {
                tiempo += (Date.now() - origen.inicio);
            }

            const nuevoDestino = { 
                ...destino, 
                estado: origen.estado === 'pausado' ? 'pausado' : 'ocupado', 
                inicio: origen.estado === 'pausado' ? null : Date.now(), 
                tiempoAcumulado: tiempo, 
                cuenta: [...origen.cuenta], 
                modo: origen.modo, 
                limiteTiempo: origen.limiteTiempo, 
                alertaMinuto: origen.alertaMinuto 
            };
            
            const nuevoOrigen = { 
                ...origen, 
                estado: 'libre', 
                inicio: null, 
                tiempoAcumulado: 0, 
                cuenta: [], 
                modo: 'libre', 
                limiteTiempo: 0, 
                alertaMinuto: false 
            };
            
            return prev.map(e => e.id === origen.id ? nuevoOrigen : e.id === destino.id ? nuevoDestino : e);
        });
        setModalAbierto(null);
    };

    const equiposDisponibles = equipos.filter(e => e.estado === 'libre' && e.id !== eqSel.id);

    return (
        <div className="fixed inset-0 bg-slate-500/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-anim">
             <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 w-full max-w-md modal-anim border border-white/20 dark:border-slate-700">
                <h2 className="font-bold mb-2 flex items-center gap-2 text-slate-700 dark:text-white"><ArrowRightLeft className="text-blue-500"/> Mover {eqSel.nombre}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Selecciona la estación de destino:</p>
                
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {equiposDisponibles.length === 0 ? (
                        <div className="col-span-2 text-center text-slate-400 text-sm py-4">No hay estaciones libres disponibles.</div>
                    ) : (
                        equiposDisponibles.map(e => (
                            <button key={e.id} onClick={() => confirmarIntercambio(e.id)} className="border dark:border-slate-600 p-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-bold text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 transition-colors">
                                {e.tipo === 'PC' ? <Monitor size={16} className="text-blue-500"/> : <Gamepad2 size={16} className="text-purple-500"/>} 
                                <span className="truncate">{e.nombre}</span>
                            </button>
                        ))
                    )}
                </div>
                
                <button onClick={() => setModalAbierto(null)} className="mt-4 w-full border dark:border-slate-600 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors">Cancelar</button>
             </div>
        </div>
    );
}