import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmarResetModal() {
    const { 
        modalAbierto, setModalAbierto, 
        equipoSeleccionadoId, setEquipoSeleccionadoId,
        setEquipos, 
        playSound 
    } = useSystem();

    // Este modal se activa cuando modalAbierto es 'reset'
    if (modalAbierto !== 'reset' || !equipoSeleccionadoId) return null;

    const ejecutarReset = () => {
        setEquipos(prev => prev.map(e => e.id === equipoSeleccionadoId ? { 
            ...e, 
            estado: 'libre', 
            inicio: null, 
            tiempoAcumulado: 0, 
            cuenta: [], 
            modo: 'libre', 
            limiteTiempo: 0, 
            alertaMinuto: false 
        } : e));
        
        setModalAbierto(null);
        setEquipoSeleccionadoId(null);
        playSound('warning');
    };

    const cancelar = () => {
        setModalAbierto(null);
        // No limpiamos el ID inmediatamente por si el usuario quiere volver a abrir otro modal sobre el mismo equipo, 
        // pero en este caso es una acción destructiva cancelada, así que es seguro limpiar o mantener según UX.
        // Para reset, mejor limpiar.
        setEquipoSeleccionadoId(null);
    };

    return (
        <div className="fixed inset-0 bg-black/80 dark:bg-black/90 flex items-center justify-center z-[80] fade-anim">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-sm w-full modal-anim text-center border border-white/10">
                <div className="mb-4 text-rose-600 flex justify-center"><AlertTriangle size={48}/></div>
                <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">¿Reiniciar Estación?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Se perderá el tiempo y el consumo actual sin cobrar. Esta acción no se puede deshacer.</p>
                <div className="flex gap-2">
                    <button onClick={cancelar} className="flex-1 border dark:border-slate-600 py-2 rounded text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                    <button onClick={ejecutarReset} className="flex-1 bg-rose-600 text-white py-2 rounded font-bold hover:bg-rose-700 shadow-lg transition-colors">Sí, Reiniciar</button>
                </div>
            </div>
        </div>
    );
}