import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSystem } from '../../context/SystemContext';
import { 
    ShoppingBag, X, Package, ChevronRight, Printer, FileText, ScanBarcode, 
    Bluetooth, Wifi, HandHelping, Droplet, CheckCircle, PlusCircle, 
    Minus, Ticket, Star, Zap, Coffee, Phone, Gift, Truck, Music, Globe, Briefcase, Umbrella
} from 'lucide-react';

const ICON_MAP = { Star, Zap, Coffee, Printer, Wifi, Phone, Gift, Truck, Music, Globe, Briefcase, Umbrella };

// Helper para obtener precio seguro
const getPrice = (val) => (typeof val === 'object' && val !== null && val.price !== undefined) ? val.price : val;

export default function ProductosModal() {
    const { 
        modalAbierto, setModalAbierto, 
        equipoSeleccionadoId, 
        equipos, setEquipos, 
        catalogo, 
        config, 
        addToast, 
        playSound 
    } = useSystem();

    // Estados Locales
    const [busqueda, setBusqueda] = useState('');
    const [servicioForm, setServicioForm] = useState({ 
        tipo: 'IMPRESION_BN', tamano: 'CARTA', cobertura: 'B', cantidad: 1 
    });
    const [manualItemForm, setManualItemForm] = useState({ nombre: '', precio: '' });

    // Refs para Scanner
    const barcodeBuffer = useRef('');
    const lastKeyTime = useRef(0);

    // Resetear al abrir
    useEffect(() => {
        if (modalAbierto === 'productos') {
            setBusqueda('');
            setServicioForm({ tipo: 'IMPRESION_BN', tamano: 'CARTA', cobertura: 'B', cantidad: 1 });
            setManualItemForm({ nombre: '', precio: '' });
        }
    }, [modalAbierto]);

    if (modalAbierto !== 'productos' || !equipoSeleccionadoId) return null;

    const eqSel = equipos.find(e => e.id === equipoSeleccionadoId);
    if (!eqSel) return null;

    // --- Lógica de Precios (Duplicada de VentaDirecta para consistencia) ---
    const calcularPrecio = (tipo, tamano, cobertura, cantidad) => {
        const p = config.precios;
        let unitario = 0;
        const tipoKey = tipo.toLowerCase();

        if (tipo === 'IMPRESION_BN') {
            const base = p.impresion.bn[cobertura] || 0;
            if (tamano === 'OFICIO') unitario = base + p.extras.oficio;
            else if (tamano === 'TABLOIDE') unitario = base * p.extras.tabloide;
            else unitario = base;
        } else if (tipo === 'IMPRESION_COLOR') {
            const base = p.impresion.color[cobertura] || 0;
            if (tamano === 'OFICIO') unitario = base + p.extras.oficio;
            else if (tamano === 'TABLOIDE') unitario = base * p.extras.tabloide;
            else unitario = base;
        } else if (tipo === 'ESCANEO') unitario = tamano === 'OFICIO' ? p.otros.escaneo.oficio : p.otros.escaneo.carta;
        else if (tipo === 'ENVIO') unitario = p.otros.envio;
        else if (p.otros[tipoKey] !== undefined) unitario = getPrice(p.otros[tipoKey]);

        // Descuento solo para impresiones, escaneos y envíos
        if (cantidad > 10 && ['IMPRESION_BN', 'IMPRESION_COLOR', 'ESCANEO', 'ENVIO'].includes(tipo)) unitario *= 0.90;
        return unitario;
    };

    // --- Helpers de Tiempo (Para mostrar total estimado) ---
    const calcularTiempo = (eq) => {
        if (!eq || eq.estado === 'libre') return 0;
        let t = eq.tiempoAcumulado;
        if (eq.estado === 'ocupado' && eq.inicio) t += (Date.now() - eq.inicio);
        return t;
    };

    const calcularTotalRenta = (eq) => {
        if (!eq || eq.tipo === 'DIRECTA') return 0;
        if (eq.modo === 'prepago') return 0;
        const tiempoMs = eq.estado === 'finalizado' ? eq.tiempoAcumulado : calcularTiempo(eq);
        const horas = tiempoMs / 3600000;
        const tarifa = parseFloat(eq.precioHora);
        let total = horas * tarifa;
        
        if (tiempoMs > 60000 && total < config.tarifaMinima) {
            return Math.round(config.tarifaMinima);
        }
        return Math.round(Math.max(total, 0));
    };

    // --- Acciones ---
    const agregarProductoACuenta = (prod) => {
        setEquipos(prev => prev.map(eq => {
            if (eq.id === equipoSeleccionadoId) {
                const idx = eq.cuenta.findIndex(p => p.idCatalogo === prod.id);
                if (idx !== -1) {
                    const nc = [...eq.cuenta];
                    nc[idx] = { ...nc[idx], cantidad: (nc[idx].cantidad || 1) + 1 };
                    return { ...eq, cuenta: nc };
                }
                return { ...eq, cuenta: [...eq.cuenta, { uid: Date.now(), idCatalogo: prod.id, nombre: prod.nombre, precio: parseFloat(prod.precio), cantidad: 1 }] };
            }
            return eq;
        }));
        playSound('scan');
    };

    const agregarServicioACuenta = () => {
        const { tipo, tamano, cobertura, cantidad } = servicioForm;
        const precioFinal = calcularPrecio(tipo, tamano, cobertura, cantidad);
        const tipoKey = tipo.toLowerCase();

        let nombreServicio = '';
        if (tipo === 'ENVIO') nombreServicio = `Envío Digital`;
        else if (tipo === 'ESCANEO') nombreServicio = `Escaneo ${tamano}`;
        else if (['IMPRESION_BN', 'IMPRESION_COLOR'].includes(tipo)) {
            nombreServicio = `${tipo === 'IMPRESION_BN' ? 'Imp. B/N' : 'Imp. Color'} ${tamano} (${cobertura})`;
        } else {
            nombreServicio = tipoKey.charAt(0).toUpperCase() + tipoKey.slice(1).replace(/_/g, ' ');
        }
        const nombreFinal = nombreServicio + (cantidad > 10 && ['IMPRESION_BN', 'IMPRESION_COLOR', 'ESCANEO', 'ENVIO'].includes(tipo) ? ' (-10%)' : '');

        setEquipos(prev => prev.map(eq => {
            if (eq.id === equipoSeleccionadoId) {
                const idx = eq.cuenta.findIndex(p => p.nombre === nombreFinal && p.precio === parseFloat(precioFinal));
                if (idx !== -1) {
                    const nc = [...eq.cuenta];
                    nc[idx] = { ...nc[idx], cantidad: (nc[idx].cantidad || 1) + (parseInt(cantidad) || 1) };
                    return { ...eq, cuenta: nc };
                }
                return { ...eq, cuenta: [...eq.cuenta, { uid: Date.now(), idCatalogo: null, nombre: nombreFinal, precio: parseFloat(precioFinal), cantidad: parseInt(cantidad) || 1 }] };
            }
            return eq;
        }));
        setServicioForm({ ...servicioForm, cantidad: 1 });
        playSound('success');
    };

    const agregarManualACuenta = () => {
        if(!manualItemForm.nombre || !manualItemForm.precio) return;
        const nombreFinal = manualItemForm.nombre + ' (Manual)';
        const precioFinal = parseFloat(manualItemForm.precio);
        setEquipos(prev => prev.map(eq => {
            if (eq.id === equipoSeleccionadoId) {
                const idx = eq.cuenta.findIndex(p => p.nombre === nombreFinal && p.precio === precioFinal);
                if (idx !== -1) {
                    const nc = [...eq.cuenta];
                    nc[idx] = { ...nc[idx], cantidad: (nc[idx].cantidad || 1) + 1 };
                    return { ...eq, cuenta: nc };
                }
                return { ...eq, cuenta: [...eq.cuenta, { uid: Date.now(), idCatalogo: null, nombre: nombreFinal, precio: precioFinal, cantidad: 1, esManual: true }] };
            }
            return eq;
        }));
        setManualItemForm({nombre: '', precio: ''});
        playSound('success');
    };

    const eliminarProductoDeCuenta = (uid) => { 
        setEquipos(prev => prev.map(e => e.id === equipoSeleccionadoId ? { ...e, cuenta: e.cuenta.filter(i => i.uid !== uid) } : e)); 
    };
    
    const disminuirCantidadDeCuenta = (uid) => {
         setEquipos(prev => prev.map(eq => {
            if (eq.id === equipoSeleccionadoId) {
                return { ...eq, cuenta: eq.cuenta.map(i => {
                    if (i.uid === uid) return { ...i, cantidad: (i.cantidad || 1) - 1 };
                    return i;
                }).filter(i => i.cantidad > 0) };
            }
            return eq;
         }));
    };

    // --- Scanner Effect ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            const currentTime = Date.now();
            if (currentTime - lastKeyTime.current > 100) barcodeBuffer.current = '';
            lastKeyTime.current = currentTime;
            if (e.key === 'Enter') {
                if (barcodeBuffer.current.length > 0) { 
                    const code = barcodeBuffer.current;
                    const producto = catalogo.find(p => p.codigo === code);
                    if (producto && producto.stock > 0) {
                        agregarProductoACuenta(producto);
                    } else {
                        addToast(producto ? "¡Sin stock!" : "Producto no encontrado.", 'error');
                    }
                    barcodeBuffer.current = ''; 
                }
            } else if (e.key.length === 1 && document.activeElement.tagName !== 'INPUT') { 
                barcodeBuffer.current += e.key; 
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [catalogo, equipoSeleccionadoId]);

    return (
        <div className="fixed inset-0 bg-slate-500/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-anim">
             <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden modal-anim border border-white/20 dark:border-slate-700">
                <div className="p-4 flex justify-between items-center border-b border-slate-200/50 dark:border-slate-700">
                    <h2 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white"><ShoppingBag className="text-blue-500" /> {eqSel.nombre}</h2>
                    <button onClick={() => setModalAbierto(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"><X /></button>
                </div>
                <div className="flex flex-1 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex-1 flex overflow-hidden mr-1">
                        {/* Left Column: Inventario */}
                        <div className="w-1/2 flex flex-col border-r border-slate-200/50 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
                            <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                                <div className="flex justify-between items-center"><h3 className="font-bold text-xs text-slate-500 uppercase flex items-center gap-2"><Package size={14}/> Inventario</h3></div>
                                <input className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 p-1.5 rounded text-sm outline-none focus:border-cyan-500 dark:text-white" placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                            </div>
                            <div className="flex-1 overflow-y-auto p-3"><div className="grid grid-cols-1 gap-2">{catalogo.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (p.codigo && p.codigo.includes(busqueda))).map(prod => (<button key={prod.id} disabled={prod.stock < 1} onClick={() => agregarProductoACuenta(prod)} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:shadow-md text-left disabled:opacity-50 transition-all"><span className="text-2xl">{prod.icon}</span><div className="min-w-0 flex-1"><div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{prod.nombre}</div><div className="flex justify-between items-center mt-1"><span className="text-xs text-cyan-600 font-bold bg-cyan-50 px-2 py-0.5 rounded">${prod.precio}</span><span className={`text-[10px] px-1.5 rounded font-bold ${prod.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>Stock: {prod.stock}</span></div></div><ChevronRight size={16} className="text-slate-300"/></button>))}</div></div>
                        </div>
                        {/* Middle Column: Servicios */}
                        <div className="w-1/2 flex flex-col bg-white dark:bg-slate-800">
                            <div className="p-3 border-b bg-indigo-50 dark:bg-indigo-900/20"><h3 className="font-bold text-xs text-indigo-700 dark:text-indigo-300 uppercase flex items-center gap-2"><Printer size={14}/> Servicios Rápidos</h3></div>
                            <div className="p-5 space-y-6 overflow-y-auto">
                                <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">1. Selecciona Servicio</label><div className="grid grid-cols-2 gap-3">{[{ id: 'IMPRESION_BN', label: 'Impresión B/N', icon: <FileText size={20}/>, color: 'text-slate-600' }, { id: 'IMPRESION_COLOR', label: 'Impresión Color', icon: <Printer size={20}/>, color: 'text-pink-500' }, { id: 'ESCANEO', label: 'Escaneo', icon: <ScanBarcode size={20}/>, color: 'text-blue-500' }, { id: 'ENVIO', label: 'Envío Digital', icon: <Bluetooth size={20}/>, color: 'text-indigo-500' }].map(opt => (<button key={opt.id} onClick={() => setServicioForm({...servicioForm, tipo: opt.id})} className={`p-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-2 transition-all hover:scale-105 ${servicioForm.tipo === opt.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg ring-2 ring-indigo-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm'}`}><div className={servicioForm.tipo === opt.id ? 'text-white' : opt.color}>{opt.icon}</div>{opt.label}</button>))}</div></div>
                                <div className="grid grid-cols-2 gap-3"><button onClick={() => setServicioForm({ ...servicioForm, tipo: 'WIFI' })} className={`p-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-2 transition-all hover:scale-105 ${servicioForm.tipo === 'WIFI' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><div className={servicioForm.tipo === 'WIFI' ? 'text-white' : 'text-emerald-500'}><Wifi size={20}/></div>WiFi (${config.precios.otros.wifi})</button><button onClick={() => setServicioForm({ ...servicioForm, tipo: 'ASESORIA' })} className={`p-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-2 transition-all hover:scale-105 ${servicioForm.tipo === 'ASESORIA' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><div className={servicioForm.tipo === 'ASESORIA' ? 'text-white' : 'text-amber-500'}><HandHelping size={20}/></div>Asesoría (${config.precios.otros.asesoria})</button></div>
                                {Object.entries(config.precios.otros).map(([key, val]) => {
                                    if (['wifi', 'asesoria', 'envio', 'escaneo'].includes(key)) return null;
                                    
                                    let price = val;
                                    let iconName = 'Star';
                                    if (typeof val === 'object' && val.price !== undefined) {
                                        price = val.price;
                                        iconName = val.icon || 'Star';
                                    } else if (typeof val !== 'number') return null;

                                    const IconComp = ICON_MAP[iconName] || Star;
                                    const typeId = key.toUpperCase();
                                    return (
                                        <button key={key} onClick={() => setServicioForm({ ...servicioForm, tipo: typeId })} className={`p-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-2 transition-all hover:scale-105 ${servicioForm.tipo === typeId ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                            <div className={servicioForm.tipo === typeId ? 'text-white' : 'text-indigo-500'}><IconComp size={20}/></div>
                                            <span className="capitalize">{key.replace(/_/g, ' ')}</span> (${price})
                                        </button>
                                    );
                                })}
                                {(servicioForm.tipo === 'IMPRESION_BN' || servicioForm.tipo === 'IMPRESION_COLOR') && (<div className="fade-anim"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1"><Droplet size={12}/> 2. Cobertura de Tinta</label><div className="grid grid-cols-3 gap-2">{[{ id: 'B', label: 'Básica', desc: 'Texto simple', price: config.precios.impresion[servicioForm.tipo === 'IMPRESION_BN' ? 'bn' : 'color']['B'] }, { id: 'M', label: 'Media', desc: 'Con imágenes', price: config.precios.impresion[servicioForm.tipo === 'IMPRESION_BN' ? 'bn' : 'color']['M'] }, { id: 'G', label: 'Alta', desc: 'Fotos / Full', price: config.precios.impresion[servicioForm.tipo === 'IMPRESION_BN' ? 'bn' : 'color']['G'] }].map(cob => (<button key={cob.id} onClick={() => setServicioForm({...servicioForm, cobertura: cob.id})} className={`p-2 rounded-lg border text-left transition-all ${servicioForm.cobertura === cob.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><div className="flex justify-between items-center mb-1"><span className={`font-bold text-xs ${servicioForm.cobertura === cob.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{cob.label}</span><span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-600 px-1.5 rounded text-slate-600 dark:text-slate-300">${cob.price}</span></div><div className="text-[10px] text-slate-400 leading-tight">{cob.desc}</div></button>))}</div></div>)}
                                {servicioForm.tipo !== 'ENVIO' && servicioForm.tipo !== 'WIFI' && servicioForm.tipo !== 'ASESORIA' && (<div className="fade-anim delay-75"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">3. Tamaño de Papel</label><div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">{['CARTA', 'OFICIO', 'TABLOIDE'].map(tam => ((servicioForm.tipo === 'ESCANEO' && tam === 'TABLOIDE') ? null : <button key={tam} onClick={() => setServicioForm({...servicioForm, tamano: tam})} className={`flex-1 py-2 text-xs rounded-md font-bold transition-all ${servicioForm.tamano === tam ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm transform scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>{tam}</button>))}</div></div>)}
                                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600"><div className="flex gap-4 items-end mb-3"><div className="w-24"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Cantidad</label><input type="number" min="1" className="w-full border-2 border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 p-2 rounded-lg font-bold text-center text-lg focus:border-indigo-500 outline-none dark:text-white" value={servicioForm.cantidad} onChange={e => setServicioForm({...servicioForm, cantidad: parseInt(e.target.value) || 1})} /></div><div className="flex-1 text-right"><div className="text-xs text-slate-400 uppercase font-bold">Total Estimado</div><div className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">${(calcularPrecio(servicioForm.tipo, servicioForm.tamano, servicioForm.cobertura, servicioForm.cantidad) * servicioForm.cantidad).toFixed(2)}</div>{servicioForm.cantidad > 10 && servicioForm.tipo !== 'WIFI' && servicioForm.tipo !== 'ASESORIA' && <div className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">✨ 10% Descuento Mayoreo</div>}</div></div><button onClick={agregarServicioACuenta} className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-lg font-bold shadow-lg flex justify-center items-center gap-2 transition-all transform active:scale-95"><CheckCircle size={20} className="text-emerald-400"/> Agregar a la Cuenta</button></div>
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Agregar Cargo Manual</label><div className="flex gap-2"><input className="flex-1 border dark:border-slate-600 bg-white dark:bg-slate-800 p-2 rounded text-sm dark:text-white" placeholder="Concepto (ej. Engargolado)" value={manualItemForm.nombre} onChange={e => setManualItemForm({...manualItemForm, nombre: e.target.value})} /><input className="w-20 border dark:border-slate-600 bg-white dark:bg-slate-800 p-2 rounded text-sm dark:text-white" type="number" placeholder="$" value={manualItemForm.precio} onChange={e => setManualItemForm({...manualItemForm, precio: e.target.value})} /><button onClick={agregarManualACuenta} className="bg-slate-700 text-white px-3 rounded hover:bg-slate-800"><PlusCircle size={18}/></button></div></div>
                            </div>
                        </div>
                    </div>
                    {/* Right Column: Carrito */}
                    <div className="w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col shadow-2xl z-20"><div className="p-4 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center"><div><h3 className="font-bold text-slate-700 dark:text-white text-sm uppercase tracking-wide">Cuenta Actual</h3><p className="text-[10px] text-slate-400">Resumen de consumos</p></div><span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-bold">{eqSel.cuenta.length} Items</span></div><div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">{eqSel.cuenta.map((i) => (<div key={i.uid} className="bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 group relative hover:border-indigo-300 transition-all"><div className="flex justify-between items-center"><div><div className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{i.nombre}</div>{i.esManual && <span className="text-[10px] bg-slate-100 dark:bg-slate-600 px-1 rounded text-slate-500 dark:text-slate-300">Manual</span>}<div className="text-[10px] text-slate-400 mt-0.5">{i.cantidad} x ${i.precio}</div></div><div className="flex items-center gap-3"><div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">${(i.precio * (i.cantidad || 1)).toFixed(2)}</div><div className="flex items-center"><button onClick={() => disminuirCantidadDeCuenta(i.uid)} className="p-1 text-slate-300 hover:text-amber-500 transition-colors" title="Disminuir"><Minus size={16}/></button><button onClick={() => eliminarProductoDeCuenta(i.uid)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors" title="Eliminar"><X size={16}/></button></div></div></div></div>))}{eqSel.cuenta.length === 0 && (<div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60"><ShoppingBag size={48} className="mb-2 stroke-1"/><span className="text-xs font-medium">Carrito vacío</span><span className="text-[10px]">Agregue productos o servicios</span></div>)}</div><div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"><div className="space-y-1 mb-4"><div className="flex justify-between text-xs text-slate-500 dark:text-slate-400"><span>Subtotal Productos</span><span>${eqSel.cuenta.reduce((a,x)=>a+(x.precio*(x.cantidad||1)),0).toFixed(2)}</span></div><div className="flex justify-between text-xs text-slate-500 dark:text-slate-400"><span>Renta Estimada (Tiempo)</span><span>${calcularTotalRenta(eqSel).toFixed(2)}</span></div></div><div className="flex justify-between items-center pt-3 border-t border-dashed border-slate-300 dark:border-slate-600 mb-4"><span className="font-bold text-lg text-slate-700 dark:text-white">Total a Pagar</span><span className="font-black text-2xl text-indigo-600 dark:text-indigo-400 tracking-tight">${(calcularTotalRenta(eqSel) + eqSel.cuenta.reduce((a,x)=>a+(x.precio*(x.cantidad||1)),0)).toFixed(2)}</span></div><button onClick={() => setModalAbierto('cobrar')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2"><Ticket size={18}/> Cobrar Cuenta</button></div></div>
                </div>
             </div>
        </div>
    );
}