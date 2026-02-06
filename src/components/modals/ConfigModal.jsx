import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { 
    Settings, X, Building, FileText, DollarSign, ArrowRightLeft, Trash2, Plus,
    Star, Zap, Coffee, Printer, Wifi, Phone, Gift, Truck, Music, Globe, Briefcase, Umbrella
} from 'lucide-react';

const AVAILABLE_ICONS = { Star, Zap, Coffee, Printer, Wifi, Phone, Gift, Truck, Music, Globe, Briefcase, Umbrella };

export default function ConfigModal() {
    const { modalAbierto, setModalAbierto, config, setConfig, addToast } = useSystem();
    const [nuevoServicio, setNuevoServicio] = useState({ nombre: '', precio: '', icon: 'Star' });

    // Helper para inputs de configuración (maneja número u objeto)
    const getVal = (val) => (typeof val === 'object' && val?.price !== undefined) ? val.price : val;
    const setVal = (oldVal, newVal) => {
        if (typeof oldVal === 'object' && oldVal?.price !== undefined) return { ...oldVal, price: newVal };
        return newVal;
    };

    if (!['config', 'config_precios', 'config_ticket'].includes(modalAbierto)) return null;

    const agregarServicio = () => {
        if (!nuevoServicio.nombre || !nuevoServicio.precio) return addToast("Nombre y precio requeridos", 'warning');
        if (parseFloat(nuevoServicio.precio) < 0) return addToast("El precio no puede ser negativo", 'warning');
        
        const key = nuevoServicio.nombre.trim().toLowerCase().replace(/\s+/g, '_');
        
        if (config.precios.otros[key] !== undefined) return addToast("Este servicio ya existe", 'error');

        setConfig(prev => ({
            ...prev,
            precios: { ...prev.precios, otros: { ...prev.precios.otros, [key]: { price: parseFloat(nuevoServicio.precio), icon: nuevoServicio.icon } } }
        }));
        setNuevoServicio({ nombre: '', precio: '', icon: 'Star' });
        addToast("Servicio agregado correctamente", 'success');
    };

    const eliminarServicio = (key) => {
        const newOtros = { ...config.precios.otros };
        delete newOtros[key];
        setConfig(prev => ({ ...prev, precios: { ...prev.precios, otros: newOtros } }));
    };

    return (
        <div className="fixed inset-0 bg-slate-500/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-anim">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col modal-anim border border-white/20 dark:border-slate-700">
                
                {/* HEADER */}
                <div className="p-4 border-b border-slate-200/50 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        {modalAbierto === 'config' && <><Settings className="text-slate-500"/> Configuración General</>}
                        {modalAbierto === 'config_precios' && <><DollarSign className="text-slate-500"/> Precios</>}
                        {modalAbierto === 'config_ticket' && <><FileText className="text-slate-500"/> Diseño Ticket</>}
                    </h2>
                    <div className="flex gap-2">
                        {modalAbierto !== 'config' && (
                            <button onClick={() => setModalAbierto('config')} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                <ArrowRightLeft size={20} className="text-slate-500 dark:text-slate-400"/>
                            </button>
                        )}
                        <button onClick={() => setModalAbierto(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                            <X size={20} className="text-slate-500 dark:text-slate-400"/>
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {modalAbierto === 'config' && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h3 className="font-bold text-amber-800 dark:text-amber-400 text-xs uppercase flex items-center gap-2"><Building size={14}/> Datos del Negocio</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div><label className="text-[10px] font-bold text-slate-500 uppercase">Nombre</label><input className="w-full border p-1.5 rounded text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={config.negocio.nombre} onChange={e => setConfig({...config, negocio: {...config.negocio, nombre: e.target.value}})} /></div>
                                    <div><label className="text-[10px] font-bold text-slate-500 uppercase">RFC</label><input className="w-full border p-1.5 rounded text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={config.negocio.rfc} onChange={e => setConfig({...config, negocio: {...config.negocio, rfc: e.target.value}})} /></div>
                                    <div className="md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase">Dirección</label><input className="w-full border p-1.5 rounded text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={config.negocio.direccion} onChange={e => setConfig({...config, negocio: {...config.negocio, direccion: e.target.value}})} /></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t dark:border-slate-700 pt-4">
                                <div className="text-sm text-slate-700 dark:text-slate-300"><span className="font-bold block">Tarifa Mínima</span><span className="text-xs opacity-75">Cobro mínimo por renta</span></div>
                                <div className="flex items-center gap-2"><span className="font-bold">$</span><input type="number" className="w-20 border p-1 rounded text-center font-bold dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={config.tarifaMinima} onChange={e => setConfig({...config, tarifaMinima: parseFloat(e.target.value) || 0})} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button onClick={() => setModalAbierto('config_ticket')} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 rounded-xl font-bold flex flex-col items-center gap-1 transition-colors dark:text-white"><FileText size={24}/> Ticket</button>
                                <button onClick={() => setModalAbierto('config_precios')} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 rounded-xl font-bold flex flex-col items-center gap-1 transition-colors dark:text-white"><DollarSign size={24}/> Precios</button>
                            </div>
                        </div>
                    )}

                    {modalAbierto === 'config_precios' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Impresión B/N</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['B', 'M', 'G'].map(k => (
                                        <div key={k}><span className="text-[10px] text-slate-400 block">{k === 'B' ? 'Básica' : k === 'M' ? 'Media' : 'Alta'}</span><input type="number" className="w-full border p-1 rounded text-center font-bold dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={config.precios.impresion.bn[k]} onChange={e => setConfig({...config, precios: {...config.precios, impresion: {...config.precios.impresion, bn: {...config.precios.impresion.bn, [k]: parseFloat(e.target.value)}}}})} /></div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Impresión Color</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['B', 'M', 'G'].map(k => (
                                        <div key={k}><span className="text-[10px] text-slate-400 block">{k === 'B' ? 'Básica' : k === 'M' ? 'Media' : 'Alta'}</span><input type="number" className="w-full border p-1 rounded text-center font-bold dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={config.precios.impresion.color[k]} onChange={e => setConfig({...config, precios: {...config.precios, impresion: {...config.precios.impresion, color: {...config.precios.impresion.color, [k]: parseFloat(e.target.value)}}}})} /></div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Servicios Rápidos</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {config.precios.otros.wifi !== undefined && (
                                        <div className="relative group">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-400 block">WiFi</span>
                                                <button onClick={() => eliminarServicio('wifi')} className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5" title="Eliminar"><Trash2 size={12}/></button>
                                            </div>
                                            <input type="number" className="w-full border p-1 rounded text-center font-bold dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={getVal(config.precios.otros.wifi)} onChange={e => setConfig({...config, precios: {...config.precios, otros: {...config.precios.otros, wifi: setVal(config.precios.otros.wifi, parseFloat(e.target.value))}}})} />
                                        </div>
                                    )}
                                    {config.precios.otros.asesoria !== undefined && (
                                        <div className="relative group">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-400 block">Asesoría</span>
                                                <button onClick={() => eliminarServicio('asesoria')} className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5" title="Eliminar"><Trash2 size={12}/></button>
                                            </div>
                                            <input type="number" className="w-full border p-1 rounded text-center font-bold dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={getVal(config.precios.otros.asesoria)} onChange={e => setConfig({...config, precios: {...config.precios, otros: {...config.precios.otros, asesoria: setVal(config.precios.otros.asesoria, parseFloat(e.target.value))}}})} />
                                        </div>
                                    )}
                                    {config.precios.otros.envio !== undefined && (
                                        <div className="relative group">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-400 block">Envío Digital</span>
                                                <button onClick={() => eliminarServicio('envio')} className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5" title="Eliminar"><Trash2 size={12}/></button>
                                            </div>
                                            <input type="number" className="w-full border p-1 rounded text-center font-bold dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={getVal(config.precios.otros.envio)} onChange={e => setConfig({...config, precios: {...config.precios, otros: {...config.precios.otros, envio: setVal(config.precios.otros.envio, parseFloat(e.target.value))}}})} />
                                        </div>
                                    )}
                                    <div><span className="text-[10px] text-slate-400 block">Escaneo Carta</span><input type="number" className="w-full border p-1 rounded text-center font-bold dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={config.precios.otros.escaneo?.carta || 0} onChange={e => setConfig({...config, precios: {...config.precios, otros: {...config.precios.otros, escaneo: {...(config.precios.otros.escaneo || {}), carta: parseFloat(e.target.value)}}}})} /></div>
                                    <div><span className="text-[10px] text-slate-400 block">Escaneo Oficio</span><input type="number" className="w-full border p-1 rounded text-center font-bold dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={config.precios.otros.escaneo?.oficio || 0} onChange={e => setConfig({...config, precios: {...config.precios, otros: {...config.precios.otros, escaneo: {...(config.precios.otros.escaneo || {}), oficio: parseFloat(e.target.value)}}}})} /></div>
                                    
                                    {/* Renderizado dinámico para otros servicios agregados manualmente */}
                                    {Object.entries(config.precios.otros).map(([key, val]) => {
                                        if (['wifi', 'asesoria', 'envio', 'escaneo'].includes(key)) return null;
                                        
                                        let price = val;
                                        let IconComp = Star;
                                        if (typeof val === 'object' && val.price !== undefined) {
                                            price = val.price;
                                            IconComp = AVAILABLE_ICONS[val.icon] || Star;
                                        } else if (typeof val !== 'number') return null;

                                            return (
                                                <div key={key} className="relative group">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] text-slate-400 capitalize truncate flex items-center gap-1"><IconComp size={10}/> {key.replace(/_/g, ' ')}</span>
                                                        <button onClick={() => eliminarServicio(key)} className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5" title="Eliminar"><Trash2 size={12}/></button>
                                                    </div>
                                                    <input type="number" className="w-full border p-1 rounded text-center font-bold dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={price} onChange={e => setConfig({...config, precios: {...config.precios, otros: {...config.precios.otros, [key]: typeof val === 'object' ? { ...val, price: parseFloat(e.target.value) } : parseFloat(e.target.value)}}})} />
                                                </div>
                                            );
                                    })}
                                </div>

                                <div className="mt-4 pt-4 border-t dark:border-slate-700">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Agregar Nuevo Servicio</label>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                            {Object.keys(AVAILABLE_ICONS).map(iconName => {
                                                const Icon = AVAILABLE_ICONS[iconName];
                                                return (
                                                    <button 
                                                        key={iconName} 
                                                        onClick={() => setNuevoServicio({...nuevoServicio, icon: iconName})}
                                                        className={`p-2 rounded-lg border transition-all ${nuevoServicio.icon === iconName ? 'bg-indigo-100 border-indigo-500 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400'}`}
                                                    >
                                                        <Icon size={16} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-2">
                                        <input className="flex-1 border p-1.5 rounded text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="Nombre (ej. Fax)" value={nuevoServicio.nombre} onChange={e => setNuevoServicio({...nuevoServicio, nombre: e.target.value})} />
                                        <input type="number" className="w-24 border p-1.5 rounded text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="$" value={nuevoServicio.precio} onChange={e => setNuevoServicio({...nuevoServicio, precio: e.target.value})} />
                                        <button onClick={agregarServicio} className="bg-indigo-600 text-white px-3 rounded font-bold hover:bg-indigo-700 flex items-center justify-center"><Plus size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {modalAbierto === 'config_ticket' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">Encabezados</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['cant', 'desc', 'pu', 'importe'].map(k => (
                                        <input key={k} className="border p-2 rounded text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={config.ticketConfig.headers[k]} onChange={e => setConfig({...config, ticketConfig: {...config.ticketConfig, headers: {...config.ticketConfig.headers, [k]: e.target.value}}})} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">Separador de Secciones</label>
                                <input className="w-full border p-2 rounded text-sm font-mono dark:bg-slate-800 dark:border-slate-600 dark:text-white" maxLength="1" placeholder="Ej. - o =" value={config.ticketConfig.separador || '-'} onChange={e => setConfig({...config, ticketConfig: {...config.ticketConfig, separador: e.target.value}})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">Mensaje Final</label>
                                <input className="w-full border p-2 rounded text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={config.ticketConfig.mensajeFinal} onChange={e => setConfig({...config, ticketConfig: {...config.ticketConfig, mensajeFinal: e.target.value}})} />
                            </div>
                            
                            <div className="pt-4 border-t dark:border-slate-700">
                                <h3 className="font-bold text-xs text-slate-500 uppercase mb-3">Configuración de Folio</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Prefijo</label>
                                        <input className="w-full border p-2 rounded text-sm uppercase dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={config.folioConfig?.prefijo || ''} onChange={e => setConfig({...config, folioConfig: {...(config.folioConfig || {}), prefijo: e.target.value.toUpperCase()}})} placeholder="UT" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Longitud Números</label>
                                        <input type="number" min="1" max="10" className="w-full border p-2 rounded text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={config.folioConfig?.longitudSecuencia || 3} onChange={e => setConfig({...config, folioConfig: {...(config.folioConfig || {}), longitudSecuencia: parseInt(e.target.value) || 3}})} />
                                    </div>
                                    <div className="col-span-2 flex items-center gap-4 mt-1">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer dark:text-slate-300">
                                            <input type="checkbox" checked={config.folioConfig?.incluirFecha !== false} onChange={e => setConfig({...config, folioConfig: {...(config.folioConfig || {}), incluirFecha: e.target.checked}})} />
                                            Incluir Fecha (DDMMYY)
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer dark:text-slate-300">
                                            <input type="checkbox" checked={config.folioConfig?.tipoSecuencia === 'aleatorio'} onChange={e => setConfig({...config, folioConfig: {...(config.folioConfig || {}), tipoSecuencia: e.target.checked ? 'aleatorio' : 'consecutivo'}})} />
                                            Aleatorio
                                        </label>
                                    </div>
                                    <div className="col-span-2 text-[10px] text-slate-400 italic">Ejemplo: {config.folioConfig?.prefijo || 'UT'}-{config.folioConfig?.incluirFecha !== false ? '050226-' : ''}{'0'.repeat((config.folioConfig?.longitudSecuencia || 3) - 1)}1</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}