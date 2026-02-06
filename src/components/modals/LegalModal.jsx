import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { X, MapPin } from 'lucide-react';

export default function LegalModal() {
    const { modalAbierto, setModalAbierto } = useSystem();

    if (modalAbierto !== 'legal') return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[90] p-4 fade-anim">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden modal-anim border border-white/10">
                <div className="bg-slate-800 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 opacity-50"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black tracking-tight mb-1">FasTPV</h2>
                        <p className="text-blue-100 text-sm font-mono">Versión 1.0.0</p>
                    </div>
                    <button onClick={() => setModalAbierto(null)} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <div className="p-8 space-y-6 text-center">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center justify-center gap-2"><MapPin size={16} className="text-rose-500"/> Desarrollado por Ulisoft</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Orgullosamente hecho en <span className="font-bold text-slate-700 dark:text-slate-300">Hidalgo, México</span> 🇲🇽</p>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 space-y-2 border-t dark:border-slate-800 pt-4">
                        <p><strong>Aviso de Privacidad:</strong> Este software almacena datos únicamente de manera local en el dispositivo. No se transmiten datos a servidores externos ni a terceros.</p>
                        <p><strong>Licencia de Uso:</strong> Software propietario para gestión de puntos de venta y control de tiempo. Prohibida su redistribución no autorizada.</p>
                        <p>© {new Date().getFullYear()} Ulisoft Development. Todos los derechos reservados.</p>
                    </div>
                    <button onClick={() => setModalAbierto(null)} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-6 py-2 rounded-full font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cerrar</button>
                </div>
            </div>
        </div>
    );
}