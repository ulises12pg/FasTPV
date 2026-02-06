import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Monitor, X, Gamepad2, Save, Edit2, Trash2 } from 'lucide-react';

export default function EstacionesModal() {
    const { modalAbierto, setModalAbierto, equipos, setEquipos, addToast } = useSystem();
    const [estacionForm, setEstacionForm] = useState({ id: null, nombre: '', tipo: 'PC', precioHora: '' });

    if (modalAbierto !== 'estaciones') return null;

    const guardarEstacion = () => {
        if (!estacionForm.nombre || !estacionForm.precioHora) return addToast("Faltan datos", 'warning');
        const nueva = {
            id: estacionForm.id || Date.now(),
            nombre: estacionForm.nombre,
            tipo: estacionForm.tipo,
            precioHora: parseFloat(estacionForm.precioHora),
            estado: 'libre', inicio: null, tiempoAcumulado: 0, cuenta: [], modo: 'libre', limiteTiempo: 0, alertaMinuto: false
        };
        if (estacionForm.id) {
            setEquipos(prev => prev.map(e => e.id === estacionForm.id ? { ...e, nombre: estacionForm.nombre, tipo: estacionForm.tipo, precioHora: parseFloat(estacionForm.precioHora) } : e));
        } else {
            setEquipos(prev => [...prev, nueva]);
        }
        setEstacionForm({ id: null, nombre: '', tipo: 'PC', precioHora: '' });
        addToast(estacionForm.id ? "Estación actualizada" : "Estación creada", 'success');
    };

    const eliminarEstacion = (id) => {
        if(window.confirm("¿Eliminar estación? Se perderán los datos actuales.")) {
            setEquipos(prev => prev.filter(e => e.id !== id));
            addToast("Estación eliminada", 'info');
        }
    };

    const prepararEdicionEstacion = (est) => setEstacionForm(est);

    return (
        <div className="fixed inset-0 bg-slate-500/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-anim">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col modal-anim border border-white/20 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200/50 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <h2 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Monitor className="text-blue-500"/> Administrar Estaciones</h2>
                    <button onClick={() => setModalAbierto(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} className="text-slate-500 dark:text-slate-400"/></button>
                </div>
                
                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row gap-6 overflow-hidden flex-1">
                    {/* Formulario */}
                    <div className="w-full md:w-1/3 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm h-fit space-y-4 border border-slate-100 dark:border-slate-700 shrink-0">
                        <h3 className="font-bold text-sm text-slate-500 uppercase border-b dark:border-slate-700 pb-2">{estacionForm.id ? "Editar Estación" : "Nueva Estación"}</h3>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nombre</label>
                            <input className="w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900 p-2 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:text-white transition-all" placeholder="Ej. PC-01" value={estacionForm.nombre} onChange={e => setEstacionForm({...estacionForm, nombre: e.target.value})} />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Tipo</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setEstacionForm({...estacionForm, tipo: 'PC'})} className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${estacionForm.tipo === 'PC' ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}><Monitor size={20}/> PC</button>
                                <button onClick={() => setEstacionForm({...estacionForm, tipo: 'CONSOLA'})} className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${estacionForm.tipo === 'CONSOLA' ? 'bg-purple-50 border-purple-500 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}><Gamepad2 size={20}/> Consola</button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Precio por Hora</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                                <input type="number" className="w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900 p-2 pl-6 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:text-white transition-all" placeholder="0.00" value={estacionForm.precioHora} onChange={e => setEstacionForm({...estacionForm, precioHora: e.target.value})} />
                            </div>
                        </div>

                        <button onClick={guardarEstacion} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all flex justify-center items-center gap-2"><Save size={18}/> {estacionForm.id ? "Actualizar" : "Crear Estación"}</button>
                        {estacionForm.id && <button onClick={() => setEstacionForm({ id: null, nombre: '', tipo: 'PC', precioHora: '' })} className="w-full py-2 rounded text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancelar Edición</button>}
                    </div>

                    {/* Grid de Estaciones */}
                    <div className="w-full md:w-2/3 overflow-y-auto custom-scrollbar pr-2">
                        {equipos.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60"><Monitor size={48} className="mb-2 stroke-1"/><p>No hay estaciones registradas</p></div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {equipos.map(e => (
                                    <div key={e.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group relative">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={`p-3 rounded-xl ${e.tipo === 'PC' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'}`}>{e.tipo === 'PC' ? <Monitor size={24}/> : <Gamepad2 size={24}/>}</div>
                                            <div className="flex gap-1"><button onClick={() => prepararEdicionEstacion(e)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Editar"><Edit2 size={16}/></button><button onClick={() => eliminarEstacion(e.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="Eliminar"><Trash2 size={16}/></button></div>
                                        </div>
                                        <div><div className="font-bold text-slate-700 dark:text-slate-200 text-lg">{e.nombre}</div><div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 uppercase">{e.tipo}</span><span className="text-xs font-mono text-slate-400">${e.precioHora}/hr</span></div></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}