import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { LogOut } from 'lucide-react';

export default function LogoutModal() {
    const { setModalAbierto, setUsuarioActual } = useSystem();

    const confirmarLogout = () => {
        setUsuarioActual(null);
        setModalAbierto(null);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] fade-anim">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full modal-anim text-center border border-white/10">
                <div className="mb-4 bg-rose-100 dark:bg-rose-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-rose-500">
                    <LogOut size={32} />
                </div>
                <h3 className="font-bold text-xl mb-2 text-slate-800 dark:text-white">¿Cerrar Sesión?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Estás a punto de salir del sistema. ¿Estás seguro?
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setModalAbierto(null)} 
                        className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmarLogout} 
                        className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-rose-500/30 transition-all"
                    >
                        Sí, Salir
                    </button>
                </div>
            </div>
        </div>
    );
}
