import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { UserCog, X, Lock, Trash2, Save } from 'lucide-react';

export default function UsuariosModal() {
    const { modalAbierto, setModalAbierto, usuarios, setUsuarios, addToast } = useSystem();
    const [usuarioForm, setUsuarioForm] = useState({ nombre: '', pin: '', rol: 'empleado' });

    if (modalAbierto !== 'usuarios') return null;

    const guardarUsuario = () => {
        if (!usuarioForm.nombre.trim() || !usuarioForm.pin.trim()) return addToast("Faltan datos (Nombre y PIN)", 'warning');
        if (usuarioForm.pin.length !== 4) return addToast("El PIN debe ser de 4 dígitos", 'warning');
        
        const nuevoUsuario = { 
            ...usuarioForm, 
            id: Date.now() 
        };
        
        setUsuarios(prev => [...prev, nuevoUsuario]);
        setUsuarioForm({ nombre: '', pin: '', rol: 'empleado' });
        addToast("Usuario creado correctamente", 'success');
    };

    const eliminarUsuario = (id) => {
        if (id === 1) return addToast("No se puede eliminar al administrador principal", 'error');
        if (window.confirm("¿Eliminar este usuario?")) {
            setUsuarios(prev => prev.filter(u => u.id !== id));
            addToast("Usuario eliminado", 'info');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-500/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-anim">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col modal-anim border border-white/20 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-800 p-4 text-white flex justify-between items-center shrink-0">
                    <h2 className="font-bold flex items-center gap-2"><UserCog className="text-indigo-400"/> Gestión de Personal</h2>
                    <button onClick={() => setModalAbierto(null)} className="p-1 rounded-full hover:bg-slate-700 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row gap-6 overflow-hidden flex-1">
                    {/* Formulario */}
                    <div className="w-full md:w-1/3 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border dark:border-slate-700 h-fit space-y-4 shrink-0">
                        <h3 className="font-bold text-sm text-slate-500 dark:text-slate-400 uppercase border-b dark:border-slate-700 pb-2">Nuevo Usuario</h3>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nombre</label>
                            <input 
                                className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 p-2 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white transition-all" 
                                placeholder="Ej. Juan Pérez" 
                                value={usuarioForm.nombre} 
                                onChange={e => setUsuarioForm({...usuarioForm, nombre: e.target.value})} 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">PIN de Acceso (4 dígitos)</label>
                            <div className="relative">
                                <input 
                                    type="password"
                                    maxLength="4"
                                    className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 p-2 pl-8 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white transition-all tracking-widest" 
                                    placeholder="****" 
                                    value={usuarioForm.pin} 
                                    onChange={e => setUsuarioForm({...usuarioForm, pin: e.target.value.replace(/\D/g,'')})} 
                                />
                                <Lock size={14} className="absolute left-2.5 top-3 text-slate-400"/>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Rol / Permisos</label>
                            <select 
                                className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 p-2 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white transition-all" 
                                value={usuarioForm.rol} 
                                onChange={e => setUsuarioForm({...usuarioForm, rol: e.target.value})}
                            >
                                <option value="empleado">Empleado (Limitado)</option>
                                <option value="admin">Administrador (Total)</option>
                            </select>
                        </div>

                        <button onClick={guardarUsuario} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all flex justify-center items-center gap-2">
                            <Save size={18}/> Crear Usuario
                        </button>
                    </div>

                    {/* Lista de Usuarios */}
                    <div className="w-full md:w-2/3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden flex flex-col">
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <table className="w-full text-sm text-left text-slate-700 dark:text-slate-200">
                                <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold sticky top-0 shadow-sm">
                                    <tr>
                                        <th className="p-3">Nombre</th>
                                        <th className="p-3">Rol</th>
                                        <th className="p-3 text-center">PIN</th>
                                        <th className="p-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {usuarios.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="p-3 font-bold">{u.nombre}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${u.rol === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                    {u.rol}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center font-mono text-slate-400">****</td>
                                            <td className="p-3 text-right">
                                                {u.id !== 1 && (
                                                    <button onClick={() => eliminarUsuario(u.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" title="Eliminar Usuario">
                                                        <Trash2 size={16}/>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}