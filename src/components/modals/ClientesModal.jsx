import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Users, X, Trophy, Trash2, UserPlus } from 'lucide-react';

export default function ClientesModal() {
    const { modalAbierto, setModalAbierto, clientes, setClientes, addToast } = useSystem();
    const [clienteForm, setClienteForm] = useState({ nombre: '' });

    if (modalAbierto !== 'clientes') return null;

    const agregarCliente = () => {
        if (!clienteForm.nombre.trim()) return addToast("El nombre no puede estar vacío", 'warning');
        
        const nuevoCliente = {
            id: Date.now(),
            nombre: clienteForm.nombre.trim(),
            puntos: 0,
            cupones: []
        };
        
        setClientes(prev => [...prev, nuevoCliente]);
        setClienteForm({ nombre: '' });
        addToast("Cliente registrado correctamente", 'success');
    };

    const eliminarCliente = (id) => {
        if (id === 1) return; // Protección para no borrar al cliente por defecto
        if (window.confirm("¿Eliminar este cliente? Se perderán sus puntos acumulados.")) {
            setClientes(prev => prev.filter(c => c.id !== id));
            addToast("Cliente eliminado", 'info');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-500/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-anim">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden modal-anim border border-white/20 dark:border-slate-700">
                <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                    <h2 className="font-bold flex items-center gap-2"><Users className="text-pink-400"/> Gestión de Clientes</h2>
                    <button onClick={() => setModalAbierto(null)} className="p-1 rounded-full hover:bg-slate-700 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
                    {/* Formulario Agregar */}
                    <div className="flex gap-2 mb-6">
                        <div className="relative flex-1">
                            <input 
                                className="w-full border dark:border-slate-600 bg-white dark:bg-slate-800 p-2.5 pl-3 rounded-lg text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:text-white transition-all" 
                                placeholder="Nombre del Nuevo Cliente" 
                                value={clienteForm.nombre} 
                                onChange={e => setClienteForm({ nombre: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && agregarCliente()}
                                autoFocus
                            />
                        </div>
                        <button onClick={agregarCliente} className="bg-pink-600 hover:bg-pink-700 text-white px-4 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-pink-500/20 transition-all">
                            <UserPlus size={18}/> <span className="hidden sm:inline">Agregar</span>
                        </button>
                    </div>

                    {/* Lista de Clientes */}
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl h-80 overflow-y-auto custom-scrollbar shadow-inner">
                        {clientes.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60"><Users size={48} className="mb-2 stroke-1"/><p>No hay clientes registrados</p></div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {clientes.map(c => (
                                    <div key={c.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <div>
                                            <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">{c.nombre}{c.id === 1 && <span className="bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Público</span>}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {c.id}</div>
                                        </div>
                                        <div className="flex items-center gap-4">{c.id !== 1 ? <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-amber-100 dark:border-amber-800/50"><Trophy size={14} className="text-amber-500"/> {c.puntos} pts</span> : <span className="text-slate-300 dark:text-slate-600 text-xs italic pr-2">Sin Puntos</span>}{c.id !== 1 && <button onClick={() => eliminarCliente(c.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Eliminar Cliente"><Trash2 size={16}/></button>}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="mt-2 text-center"><p className="text-[10px] text-slate-400">Total: {clientes.length} clientes registrados</p></div>
                </div>
            </div>
        </div>
    );
}