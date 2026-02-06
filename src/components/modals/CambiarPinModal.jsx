import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Key, X, Save } from 'lucide-react';

export default function CambiarPinModal() {
    const { 
        modalAbierto, setModalAbierto, 
        usuarioActual, setUsuarioActual, 
        setUsuarios, 
        addToast 
    } = useSystem();

    const [pinData, setPinData] = useState({ nuevo: '', confirmar: '' });

    if (modalAbierto !== 'cambiar_pin') return null;

    const actualizarPin = () => {
        if (pinData.nuevo.length !== 4) return addToast("El PIN debe tener 4 dígitos", 'warning');
        if (pinData.nuevo !== pinData.confirmar) return addToast("Los PINs no coinciden", 'error');
        
        setUsuarios(prev => prev.map(u => u.id === usuarioActual.id ? { ...u, pin: pinData.nuevo } : u));
        setUsuarioActual(prev => ({ ...prev, pin: pinData.nuevo }));
        
        addToast("Contraseña actualizada correctamente", 'success');
        setModalAbierto(null);
        setPinData({ nuevo: '', confirmar: '' });
    };

    return (
        <div className="fixed inset-0 bg-slate-500/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 fade-anim">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden modal-anim border border-white/20 dark:border-slate-700">
                <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                    <h2 className="font-bold flex gap-2 items-center"><Key className="text-yellow-400"/> Seguridad</h2>
                    <button onClick={() => setModalAbierto(null)} className="p-1 rounded-full hover:bg-slate-700 transition-colors"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4 bg-white dark:bg-slate-900">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Cambiar contraseña para: <span className="font-bold text-slate-800 dark:text-white">{usuarioActual?.nombre}</span></p>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nuevo PIN (4 dígitos)</label>
                        <input 
                            type="password" 
                            maxLength="4" 
                            className="w-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 text-center text-xl tracking-widest outline-none focus:border-indigo-500 dark:text-white transition-all" 
                            value={pinData.nuevo} 
                            onChange={e => setPinData({...pinData, nuevo: e.target.value.replace(/\D/g,'')})} 
                            autoFocus 
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Confirmar PIN</label>
                        <input 
                            type="password" 
                            maxLength="4" 
                            className="w-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 text-center text-xl tracking-widest outline-none focus:border-indigo-500 dark:text-white transition-all" 
                            value={pinData.confirmar} 
                            onChange={e => setPinData({...pinData, confirmar: e.target.value.replace(/\D/g,'')})} 
                        />
                    </div>
                    
                    <button onClick={actualizarPin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-lg mt-4 flex justify-center items-center gap-2 transition-all">
                        <Save size={18}/> Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}