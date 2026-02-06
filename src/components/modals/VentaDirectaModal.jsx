import React, { useState, useEffect, useRef } from 'react';
import { useSystem } from '../../context/SystemContext';
import { generarTicket } from '../../utils/ticketGenerator';
import { RATIO_PUNTOS } from '../../constants/initialData';
import { generarFolio } from '../../utils/folioGenerator';
import { 
    Store, X, Package, ShoppingBag, PlusCircle, Minus, 
    Trash2, UserPlus, CircleDollarSign, Printer, FileText, 
    ScanBarcode, Bluetooth, Wifi, HandHelping, Droplet, CheckCircle, QrCode, 
    Star, Zap, Coffee, Phone, Gift, Truck, Music, Globe, Briefcase, Umbrella, Search
} from 'lucide-react';

const ICON_MAP = { Star, Zap, Coffee, Printer, Wifi, Phone, Gift, Truck, Music, Globe, Briefcase, Umbrella };

// Helper para obtener precio seguro (si es objeto o número)
const getPrice = (val) => (typeof val === 'object' && val !== null && val.price !== undefined) ? val.price : val;

export default function VentaDirectaModal() {
    const { 
        modalAbierto, setModalAbierto, 
        catalogo, setCatalogo, 
        clientes, setClientes, 
        ventas, setVentas, 
        usuarioActual, 
        config, 
        addToast, 
        playSound 
    } = useSystem();

    // Estados del Carrito y Venta
    const [carrito, setCarrito] = useState([]);
    const [clienteId, setClienteId] = useState(1);
    const [pagoCon, setPagoCon] = useState('');
    const [procesando, setProcesando] = useState(false);
    
    // Estados de UI y Búsqueda
    const [busqueda, setBusqueda] = useState('');
    const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
    const [nuevoClienteNombre, setNuevoClienteNombre] = useState('');

    // Formularios de Servicios y Manuales
    const [servicioForm, setServicioForm] = useState({ 
        tipo: 'IMPRESION_BN', tamano: 'CARTA', cobertura: 'B', cantidad: 1 
    });
    const [manualItemForm, setManualItemForm] = useState({ nombre: '', precio: '' });

    // Refs para Scanner
    const barcodeBuffer = useRef('');
    const lastKeyTime = useRef(0);

    // Resetear al abrir
    useEffect(() => {
        if (modalAbierto === 'venta_directa') {
            setCarrito([]);
            setClienteId(1);
            setPagoCon('');
            setBusqueda('');
            setServicioForm({ tipo: 'IMPRESION_BN', tamano: 'CARTA', cobertura: 'B', cantidad: 1 });
            setProcesando(false);
        }
    }, [modalAbierto]);

    if (modalAbierto !== 'venta_directa') return null;

    // --- Lógica de Precios (Servicios) ---
    const calcularPrecioServicio = (tipo, tamano, cobertura, cantidad) => {
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
        else if (p.otros[tipoKey] !== undefined) {
            unitario = getPrice(p.otros[tipoKey]);
        }

        // Descuento solo para impresiones, escaneos y envíos
        if (cantidad > 10 && ['IMPRESION_BN', 'IMPRESION_COLOR', 'ESCANEO', 'ENVIO'].includes(tipo)) unitario *= 0.90;
        return unitario;
    };

    // --- Gestión del Carrito ---
    const agregarProducto = (prod) => {
        setCarrito(prev => {
            const idx = prev.findIndex(p => p.idCatalogo === prod.id);
            if (idx !== -1) {
                const copia = [...prev];
                copia[idx] = { ...copia[idx], cantidad: (copia[idx].cantidad || 1) + 1 };
                return copia;
            }
            return [...prev, { uid: Date.now(), idCatalogo: prod.id, nombre: prod.nombre, precio: parseFloat(prod.precio), cantidad: 1 }];
        });
        playSound('scan');
    };

    const agregarServicio = () => {
        const { tipo, tamano, cobertura, cantidad } = servicioForm;
        const precioFinal = calcularPrecioServicio(tipo, tamano, cobertura, cantidad);
        const tipoKey = tipo.toLowerCase();
        
        let nombreServicio = '';
        if (tipo === 'ENVIO') nombreServicio = `Envío Digital`;
        else if (tipo === 'ESCANEO') nombreServicio = `Escaneo ${tamano}`;
        else if (['IMPRESION_BN', 'IMPRESION_COLOR'].includes(tipo)) {
            nombreServicio = `${tipo === 'IMPRESION_BN' ? 'Imp. B/N' : 'Imp. Color'} ${tamano} (${cobertura})`;
        } else {
            // Servicios planos (WiFi, Asesoría, Personalizados)
            nombreServicio = tipoKey.charAt(0).toUpperCase() + tipoKey.slice(1).replace(/_/g, ' ');
        }

        const nombreFinal = nombreServicio + (cantidad > 10 && ['IMPRESION_BN', 'IMPRESION_COLOR', 'ESCANEO', 'ENVIO'].includes(tipo) ? ' (-10%)' : '');

        setCarrito(prev => {
            const idx = prev.findIndex(p => p.nombre === nombreFinal && p.precio === parseFloat(precioFinal));
            if (idx !== -1) {
                const copia = [...prev];
                copia[idx] = { ...copia[idx], cantidad: (copia[idx].cantidad || 1) + (parseInt(cantidad) || 1) };
                return copia;
            }
            return [...prev, { uid: Date.now(), idCatalogo: null, nombre: nombreFinal, precio: parseFloat(precioFinal), cantidad: parseInt(cantidad) || 1 }];
        });
        setServicioForm({ ...servicioForm, cantidad: 1 });
        playSound('success');
    };

    const agregarManual = () => {
        if(!manualItemForm.nombre || !manualItemForm.precio) return;
        const nombreFinal = manualItemForm.nombre + ' (Manual)';
        const precioFinal = parseFloat(manualItemForm.precio);
        setCarrito(prev => {
            const idx = prev.findIndex(p => p.nombre === nombreFinal && p.precio === precioFinal);
            if (idx !== -1) {
                const copia = [...prev];
                copia[idx] = { ...copia[idx], cantidad: (copia[idx].cantidad || 1) + 1 };
                return copia;
            }
            return [...prev, { uid: Date.now(), idCatalogo: null, nombre: nombreFinal, precio: precioFinal, cantidad: 1, esManual: true }];
        });
        setManualItemForm({nombre: '', precio: ''});
        playSound('success');
    };

    const eliminarItem = (uid) => {
        setCarrito(prev => prev.filter(i => i.uid !== uid));
    };

    const disminuirCantidad = (uid) => {
        setCarrito(prev => prev.map(i => {
            if (i.uid === uid) return { ...i, cantidad: (i.cantidad || 1) - 1 };
            return i;
        }).filter(i => i.cantidad > 0));
    };

    // --- Gestión de Clientes ---
    const agregarClienteRapido = () => {
        if(!nuevoClienteNombre.trim()) return addToast("Nombre vacío", 'warning');
        const nuevo = { id: Date.now(), nombre: nuevoClienteNombre, puntos: 0 };
        setClientes(prev => [...prev, nuevo]);
        setClienteId(nuevo.id);
        setNuevoClienteNombre('');
        setMostrarNuevoCliente(false);
        addToast("Cliente registrado y seleccionado.", 'success');
    };

    // --- Cobro ---
    const cobrar = async () => {
        if (carrito.length === 0) return addToast("El carrito está vacío.", 'warning');
        
        setProcesando(true);
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const total = carrito.reduce((a, i) => a + (i.precio * (i.cantidad || 1)), 0);
        const pago = parseFloat(pagoCon) || 0;
        const cambio = pago - total;

        const cliente = clientes.find(c => c.id === parseInt(clienteId)) || { id: 1, nombre: 'Público General', puntos: 0 };
        let puntosGanados = 0;
        
        if (cliente.id !== 1) { 
            puntosGanados = Math.floor(total * RATIO_PUNTOS);
            setClientes(prev => prev.map(c => c.id === cliente.id ? { ...c, puntos: (c.puntos || 0) + puntosGanados } : c));
            if(puntosGanados > 0) addToast(`🎉 ¡${cliente.nombre} ganó ${puntosGanados} Puntos!`, 'success');
        }
        
        // Actualizar Stock
        const nCat = [...catalogo];
        carrito.forEach(i => { 
            if (i.idCatalogo) { 
                const idx = nCat.findIndex(p => p.id === i.idCatalogo); 
                if (idx !== -1) nCat[idx].stock = Math.max(0, nCat[idx].stock - (i.cantidad || 1)); 
            } 
        });
        setCatalogo(nCat);

        const nuevoFolio = generarFolio(config, ventas);

        const venta = { 
            id: Date.now(), 
            folio: nuevoFolio,
            fecha: new Date().toISOString(), 
            equipo: "Mostrador", 
            cliente: cliente.nombre, 
            total, 
            puntosGanados, 
            productos: carrito, 
            subtotalRenta: 0,
            pagoCon: pago, 
            cambio: cambio,
            atendio: usuarioActual.nombre,
            cancelada: false
        };
        
        setVentas(prev => [...prev, venta]);
        generarTicket(venta, config);
        playSound('success');
        setModalAbierto(null);
        setProcesando(false);
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
                        agregarProducto(producto);
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
    }, [catalogo]);

    const totalCarrito = carrito.reduce((a, i) => a + (i.precio * (i.cantidad || 1)), 0);
    const pagoValido = (parseFloat(pagoCon) || 0) >= totalCarrito;

    return (
        <div className="fixed inset-0 bg-slate-500/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-6 fade-anim">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-3xl shadow-2xl w-full max-w-7xl h-full sm:h-[90vh] flex flex-col overflow-hidden modal-anim border border-white/40 ring-1 ring-black/5">
                {/* Header */}
                <div className="p-4 flex justify-between items-center bg-slate-900 text-white shadow-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-500/20"><Store size={24} className="text-white" /></div>
                        <div><h2 className="font-bold text-lg leading-none text-white">Venta de Mostrador</h2><p className="text-xs text-slate-400">Clientes sin equipo asignado</p></div>
                    </div>
                    <button onClick={() => setModalAbierto(null)} className="hover:bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                <div className="flex flex-1 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 flex-col sm:flex-row">
                    <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
                        
                        {/* COL 1: INVENTARIO */}
                        <div className="w-full sm:w-1/2 flex flex-col border-r border-slate-200/50 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
                            <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                                <div className="flex justify-between items-center"><h3 className="font-bold text-xs text-slate-500 uppercase flex items-center gap-2"><Package size={14}/> Inventario</h3></div>
                                <div className="relative">
                                    <Search size={14} className="absolute left-2.5 top-2 text-slate-400"/>
                                    <input 
                                        className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 p-1.5 pl-8 rounded text-sm outline-none focus:border-orange-500 dark:text-white" 
                                        placeholder="Buscar producto..." 
                                        value={busqueda} 
                                        onChange={e => setBusqueda(e.target.value)} 
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const term = busqueda.trim();
                                                const prod = catalogo.find(p => p.codigo === term);
                                                if (prod && prod.stock > 0) { agregarProducto(prod); setBusqueda(''); }
                                                else if (prod && prod.stock <= 0) { addToast("¡Sin stock!", 'error'); }
                                            }
                                        }}
                                        autoFocus 
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                                <div className="grid grid-cols-1 gap-2">
                                    {catalogo.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (p.codigo && p.codigo.includes(busqueda))).map(prod => (
                                        <button key={prod.id} disabled={prod.stock < 1} onClick={() => agregarProducto(prod)} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-900/20 hover:shadow-md text-left disabled:opacity-50 transition-all group">
                                            <span className="text-2xl">{prod.icon}</span>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-orange-700 dark:group-hover:text-orange-400">{prod.nombre}</div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">${prod.precio}</span>
                                                    <span className={`text-[10px] px-1.5 rounded font-bold ${prod.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>Stock: {prod.stock}</span>
                                                </div>
                                            </div>
                                            <PlusCircle size={20} className="text-slate-200 group-hover:text-orange-500"/>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* COL 2: SERVICIOS */}
                        <div className="w-full sm:w-1/2 flex flex-col bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
                            <div className="p-3 border-b bg-indigo-50 dark:bg-indigo-900/20"><h3 className="font-bold text-xs text-indigo-700 dark:text-indigo-300 uppercase flex items-center gap-2"><Printer size={14}/> Servicios Rápidos</h3></div>
                            <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">1. Selecciona Servicio</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[{ id: 'IMPRESION_BN', label: 'Imp. B/N', icon: <FileText size={18}/>, color: 'text-slate-600' }, { id: 'IMPRESION_COLOR', label: 'Imp. Color', icon: <Printer size={18}/>, color: 'text-pink-500' }, { id: 'ESCANEO', label: 'Escaneo', icon: <ScanBarcode size={18}/>, color: 'text-blue-500' }, { id: 'ENVIO', label: 'Envío', icon: <Bluetooth size={18}/>, color: 'text-indigo-500' }]
                                        .filter(opt => opt.id !== 'ENVIO' || config.precios.otros.envio !== undefined)
                                        .map(opt => (
                                            <button key={opt.id} onClick={() => setServicioForm({...servicioForm, tipo: opt.id})} className={`p-2 rounded-lg border text-sm font-bold flex flex-col items-center gap-1 transition-all ${servicioForm.tipo === opt.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                                <div className={servicioForm.tipo === opt.id ? 'text-white' : opt.color}>{opt.icon}</div>{opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    {config.precios.otros.wifi !== undefined && (
                                        <button onClick={() => setServicioForm({ ...servicioForm, tipo: 'WIFI' })} className={`p-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-2 transition-all hover:scale-105 ${servicioForm.tipo === 'WIFI' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                            <div className={servicioForm.tipo === 'WIFI' ? 'text-white' : 'text-emerald-500'}><Wifi size={20}/></div>WiFi (${getPrice(config.precios.otros.wifi)})
                                        </button>
                                    )}
                                    {config.precios.otros.asesoria !== undefined && (
                                        <button onClick={() => setServicioForm({ ...servicioForm, tipo: 'ASESORIA' })} className={`p-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-2 transition-all hover:scale-105 ${servicioForm.tipo === 'ASESORIA' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                            <div className={servicioForm.tipo === 'ASESORIA' ? 'text-white' : 'text-amber-500'}><HandHelping size={20}/></div>Asesoría (${getPrice(config.precios.otros.asesoria)})
                                        </button>
                                    )}
                                    
                                    {/* Renderizado Dinámico de Servicios Personalizados */}
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
                                </div>

                                {(servicioForm.tipo === 'IMPRESION_BN' || servicioForm.tipo === 'IMPRESION_COLOR') && (
                                    <div className="fade-anim">
                                        <label className="block text-xs font-bold text-slate-500 mb-2">2. Intensidad / Tipo</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[{ id: 'B', label: 'Básica', price: config.precios.impresion[servicioForm.tipo === 'IMPRESION_BN' ? 'bn' : 'color']['B'] }, { id: 'M', label: 'Media', price: config.precios.impresion[servicioForm.tipo === 'IMPRESION_BN' ? 'bn' : 'color']['M'] }, { id: 'G', label: 'Alta', price: config.precios.impresion[servicioForm.tipo === 'IMPRESION_BN' ? 'bn' : 'color']['G'] }].map(cob => (
                                                <button key={cob.id} onClick={() => setServicioForm({...servicioForm, cobertura: cob.id})} className={`p-2 rounded border text-center text-xs font-bold transition-all ${servicioForm.cobertura === cob.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>
                                                    {cob.label}<br/><span className="text-slate-400 font-normal">${cob.price}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-200 dark:border-slate-600">
                                    {servicioForm.tipo !== 'ENVIO' && servicioForm.tipo !== 'WIFI' && servicioForm.tipo !== 'ASESORIA' && (
                                        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border dark:border-slate-600 mb-3">
                                            {['CARTA', 'OFICIO', 'TABLOIDE'].map(tam => ((servicioForm.tipo === 'ESCANEO' && tam === 'TABLOIDE') ? null : <button key={tam} onClick={() => setServicioForm({...servicioForm, tamano: tam})} className={`flex-1 py-1 text-[10px] rounded font-bold transition-all ${servicioForm.tamano === tam ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm transform scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>{tam}</button>))}
                                        </div>
                                    )}
                                    <div className="flex gap-2 items-center mb-3">
                                        <div className="flex-1"><label className="block text-[10px] font-bold text-slate-500 mb-1">Cant.</label><input type="number" min="1" className="w-full border dark:border-slate-600 bg-white dark:bg-slate-800 p-2 rounded-lg font-bold text-center outline-none focus:border-indigo-500 dark:text-white" value={servicioForm.cantidad} onChange={e => setServicioForm({...servicioForm, cantidad: parseInt(e.target.value) || 1})} /></div>
                                        <div className="flex-[2] text-right"><div className="text-[10px] text-slate-400 uppercase font-bold">Total Item</div><div className="text-xl font-black text-slate-800 dark:text-white">${(calcularPrecioServicio(servicioForm.tipo, servicioForm.tamano, servicioForm.cobertura, servicioForm.cantidad) * servicioForm.cantidad).toFixed(2)}</div></div>
                                    </div>
                                    <button onClick={agregarServicio} className="w-full bg-slate-900 hover:bg-black text-white py-2 rounded-lg font-bold shadow flex justify-center items-center gap-2 text-sm"><CheckCircle size={16}/> Agregar</button>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Agregar Cargo Manual</label>
                                    <div className="flex gap-2">
                                        <input className="flex-1 border dark:border-slate-600 bg-white dark:bg-slate-800 p-2 rounded text-sm dark:text-white" placeholder="Concepto (ej. Engargolado)" value={manualItemForm.nombre} onChange={e => setManualItemForm({...manualItemForm, nombre: e.target.value})} />
                                        <input className="w-20 border dark:border-slate-600 bg-white dark:bg-slate-800 p-2 rounded text-sm dark:text-white" type="number" placeholder="$" value={manualItemForm.precio} onChange={e => setManualItemForm({...manualItemForm, precio: e.target.value})} />
                                        <button onClick={agregarManual} className="bg-slate-700 text-white px-3 rounded hover:bg-slate-800"><PlusCircle size={18}/></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COL 3: CARRITO Y COBRO */}
                    <div className="w-full sm:w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col shadow-2xl z-20 h-1/3 sm:h-auto border-t sm:border-t-0">
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-800 flex justify-between items-center"><div><h3 className="font-bold text-orange-800 dark:text-orange-300 text-sm uppercase">Carrito Mostrador</h3></div><span className="bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full text-xs font-bold">{carrito.length} Items</span></div>
                        
                        <div className="px-4 py-2 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Cliente (Para Puntos)</label>
                            <div className="flex gap-2">
                                <select className="flex-1 border dark:border-slate-600 text-sm rounded p-1 bg-slate-50 dark:bg-slate-700 dark:text-white" value={clienteId} onChange={e => setClienteId(e.target.value)}>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
                                <button onClick={() => setMostrarNuevoCliente(!mostrarNuevoCliente)} className="bg-indigo-100 text-indigo-600 p-1 rounded hover:bg-indigo-200" title="Nuevo Cliente"><UserPlus size={18}/></button>
                            </div>
                            {mostrarNuevoCliente && (<div className="mt-2 bg-indigo-50 p-2 rounded flex gap-2 fade-anim"><input className="flex-1 text-xs border rounded p-1" placeholder="Nombre Cliente" value={nuevoClienteNombre} onChange={e => setNuevoClienteNombre(e.target.value)} autoFocus /><button onClick={agregarClienteRapido} className="bg-indigo-600 text-white text-xs font-bold px-2 rounded hover:bg-indigo-700">OK</button></div>)}
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
                            {carrito.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60"><ShoppingBag size={48} className="mb-2 stroke-1"/><span className="text-xs font-medium">Carrito vacío</span></div>) : (carrito.map((i) => (<div key={i.uid} className="bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 flex justify-between items-center group"><div><div className="font-bold text-sm text-slate-800 dark:text-white">{i.nombre}</div><div className="text-xs text-slate-400">{i.cantidad} x ${i.precio}</div></div><div className="flex items-center gap-3"><div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">${(i.precio * (i.cantidad || 1)).toFixed(2)}</div><div className="flex items-center"><button onClick={() => disminuirCantidad(i.uid)} className="p-1 text-slate-300 hover:text-amber-500 transition-colors" title="Disminuir"><Minus size={16}/></button><button onClick={() => eliminarItem(i.uid)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors" title="Eliminar"><X size={16}/></button></div></div></div>)))}
                        </div>

                        <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-lg text-slate-700 dark:text-slate-200">Total a Cobrar</span>
                                <span className="font-black text-3xl text-orange-600">${totalCarrito.toFixed(2)}</span>
                            </div>
                            
                            <div className="mb-4 bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600">
                                <div className="flex items-center gap-2 mb-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 w-20">Paga con:</label>
                                    <input type="number" className="flex-1 border dark:border-slate-600 bg-white dark:bg-slate-800 p-1 rounded text-sm font-bold text-right dark:text-white" placeholder="$0.00" value={pagoCon} onChange={e => setPagoCon(e.target.value)}/>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 w-20">Cambio:</label>
                                    <div className="flex-1 text-right text-lg font-black text-emerald-600">${(parseFloat(pagoCon) - totalCarrito).toFixed(2)}</div>
                                </div>
                            </div>

                            <button onClick={cobrar} disabled={procesando || !pagoValido || carrito.length === 0} className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2 ${(procesando || !pagoValido || carrito.length === 0) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
                                {procesando ? <div className="spinner" style={{borderColor: 'rgba(255,255,255,0.3)', borderLeftColor: '#fff'}}></div> : <><CircleDollarSign size={24}/> COBRAR AHORA</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}