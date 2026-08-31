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
        playSound,
        carritoMostrador: carrito, setCarritoMostrador: setCarrito,
        clienteMostradorId: clienteId, setClienteMostradorId: setClienteId
    } = useSystem();

    // Estados de Venta (transitorios)
    const [pagoCon, setPagoCon] = useState('');
    const [procesando, setProcesando] = useState(false);
    
    // Estados de UI y Búsqueda
    const [busqueda, setBusqueda] = useState('');
    const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
    const [nuevoClienteNombre, setNuevoClienteNombre] = useState('');

    // Formularios de Servicios y Manuales
    const [servicioForm, setServicioForm] = useState({ 
        tipo: 'IMPRESION_BN', tamano: 'CARTA', cobertura: 50, cantidad: 1 
    });
    const [manualItemForm, setManualItemForm] = useState({ nombre: '', precio: '' });

    // Refs para Scanner
    const barcodeBuffer = useRef('');
    const lastKeyTime = useRef(0);

    // Resetear solo UI transitoria al abrir (carrito y cliente persisten)
    useEffect(() => {
        if (modalAbierto === 'venta_directa') {
            setPagoCon('');
            setBusqueda('');
            setServicioForm({ tipo: 'IMPRESION_BN', tamano: 'CARTA', cobertura: 50, cantidad: 1 });
            setManualItemForm({ nombre: '', precio: '' });
            setMostrarNuevoCliente(false);
            setProcesando(false);
        }
    }, [modalAbierto]);

    if (modalAbierto !== 'venta_directa') return null;

    // --- Lógica de Precios (Servicios) ---
    // Interpola el precio base según porcentaje de cobertura (0-100)
    // 0% -> precio B, 50% -> precio M, 100% -> precio G
    const interpolarPrecioCobertura = (pB, pM, pG, pct) => {
        if (pct <= 50) return pB + (pM - pB) * (pct / 50);
        return pM + (pG - pM) * ((pct - 50) / 50);
    };

    const calcularPrecioServicio = (tipo, tamano, cobertura, cantidad) => {
        const p = config.precios;
        let unitario = 0;
        const tipoKey = tipo.toLowerCase();

        if (tipo === 'IMPRESION_BN') {
            const pct = typeof cobertura === 'number' ? cobertura : (cobertura === 'B' ? 0 : cobertura === 'M' ? 50 : 100);
            const base = interpolarPrecioCobertura(p.impresion.bn.B, p.impresion.bn.M, p.impresion.bn.G, pct);
            if (tamano === 'OFICIO') unitario = base + p.extras.oficio;
            else if (tamano === 'TABLOIDE') unitario = base * p.extras.tabloide;
            else unitario = base;
        } else if (tipo === 'IMPRESION_COLOR') {
            const pct = typeof cobertura === 'number' ? cobertura : (cobertura === 'B' ? 0 : cobertura === 'M' ? 50 : 100);
            const base = interpolarPrecioCobertura(p.impresion.color.B, p.impresion.color.M, p.impresion.color.G, pct);
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
            const pct = typeof cobertura === 'number' ? cobertura : (cobertura === 'B' ? 0 : cobertura === 'M' ? 50 : 100);
            nombreServicio = `${tipo === 'IMPRESION_BN' ? 'Imp. B/N' : 'Imp. Color'} ${tamano} (${pct}% tinta)`;
        } else {
            // Servicios planos (WiFi, Asesoría, Personalizados)
            nombreServicio = tipoKey.charAt(0).toUpperCase() + tipoKey.slice(1).replace(/_/g, ' ');
        }

        const nombreFinal = nombreServicio + (cantidad > 10 && ['IMPRESION_BN', 'IMPRESION_COLOR', 'ESCANEO', 'ENVIO'].includes(tipo) ? ' (-10%)' : '');

        setCarrito(prev => {
            const idx = prev.findIndex(p => p.nombre === nombreFinal && p.precio === parseFloat(precioFinal.toFixed(2)));
            if (idx !== -1) {
                const copia = [...prev];
                copia[idx] = { ...copia[idx], cantidad: (copia[idx].cantidad || 1) + (parseInt(cantidad) || 1) };
                return copia;
            }
            return [...prev, { uid: Date.now(), idCatalogo: null, nombre: nombreFinal, precio: parseFloat(precioFinal.toFixed(2)), cantidad: parseInt(cantidad) || 1 }];
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

    const incrementarCantidad = (uid) => {
        setCarrito(prev => prev.map(i => {
            if (i.uid === uid) return { ...i, cantidad: (i.cantidad || 1) + 1 };
            return i;
        }));
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
        // Limpiar carrito y cliente tras venta exitosa
        setCarrito([]);
        setClienteId(1);
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
                                <div className="relative flex items-center">
                                    <Search size={14} className="absolute left-2.5 text-slate-400"/>
                                    <input 
                                        className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 p-1.5 pl-8 pr-8 rounded text-sm outline-none focus:border-orange-500 dark:text-white" 
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
                                    {busqueda && (
                                        <button 
                                            onClick={() => setBusqueda('')}
                                            className="absolute right-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                                <div className="grid grid-cols-1 gap-2">
                                    {catalogo.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (p.codigo && p.codigo.includes(busqueda))).map(prod => {
                                        const enCarrito = carrito.find(c => c.idCatalogo === prod.id);
                                        const stockRestante = prod.stock - (enCarrito ? enCarrito.cantidad : 0);
                                        return (
                                            <div key={prod.id} className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-900/20 hover:shadow-md text-left transition-all group relative rounded-2xl ${stockRestante < 1 ? 'opacity-70 border-rose-200' : 'border-slate-100 dark:border-slate-700'}`}>
                                                <span className="text-2xl">{prod.icon}</span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{prod.nombre}</div>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">${prod.precio}</span>
                                                        <span className={`text-[10px] px-1.5 rounded font-bold ${stockRestante < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>Disp: {Math.max(0, stockRestante)}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {enCarrito && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); disminuirCantidad(enCarrito.uid); }}
                                                            className="p-1.5 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-full transition-colors shadow-sm"
                                                            title="Quitar 1"
                                                        >
                                                            <Minus size={16} strokeWidth={3}/>
                                                        </button>
                                                    )}
                                                    <button 
                                                        disabled={stockRestante < 1}
                                                        onClick={(e) => { e.stopPropagation(); agregarProducto(prod); }}
                                                        className="p-1.5 bg-emerald-50 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-full transition-colors disabled:opacity-50 shadow-sm pl-[7px] pr-[7px]"
                                                        title="Agregar 1"
                                                    >
                                                        <PlusCircle size={16} strokeWidth={3}/>
                                                    </button>
                                                </div>
                                                
                                                {/* Badge if in cart */}
                                                {enCarrito && (
                                                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-md border-2 border-white dark:border-slate-800 z-10 pointer-events-none">
                                                        {enCarrito.cantidad}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
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

                                {(servicioForm.tipo === 'IMPRESION_BN' || servicioForm.tipo === 'IMPRESION_COLOR') && (() => {
                                    const p = config.precios.impresion[servicioForm.tipo === 'IMPRESION_BN' ? 'bn' : 'color'];
                                    const pct = typeof servicioForm.cobertura === 'number' ? servicioForm.cobertura : 50;
                                    const precioInterpolado = calcularPrecioServicio(servicioForm.tipo, servicioForm.tamano, pct, 1);
                                    const pctColor = pct <= 33 ? '#22c55e' : pct <= 66 ? '#f59e0b' : '#ef4444';
                                    const pctLabel = pct <= 33 ? 'Baja (texto)' : pct <= 66 ? 'Media (imágenes)' : 'Alta (fotos/relleno)';
                                    return (
                                        <div className="fade-anim">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                                    <Droplet size={12} style={{ color: pctColor }}/> 2. Cobertura de Tinta
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: pctColor + '20', color: pctColor }}>{pctLabel}</span>
                                                    <span className="text-sm font-black text-slate-800 dark:text-white">${precioInterpolado.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <input
                                                        type="range"
                                                        min="0" max="100" step="1"
                                                        value={pct}
                                                        onChange={e => setServicioForm({...servicioForm, cobertura: parseInt(e.target.value)})}
                                                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                                        style={{
                                                            background: `linear-gradient(to right, ${pctColor} 0%, ${pctColor} ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`
                                                        }}
                                                    />
                                                    <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-1 px-0.5">
                                                        <span>0% · ${p.B}</span>
                                                        <span>50% · ${p.M}</span>
                                                        <span>100% · ${p.G}</span>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-2xl font-black" style={{ color: pctColor }}>{pct}%</span>
                                                    <span className="text-xs text-slate-400 ml-1">de tinta</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                                <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-200 dark:border-slate-600">
                                    {servicioForm.tipo !== 'ENVIO' && servicioForm.tipo !== 'WIFI' && servicioForm.tipo !== 'ASESORIA' && (() => { const activos = config.precios.extras.tamanosActivos || { carta: true, oficio: true, tabloide: true }; const tamanos = ['CARTA', 'OFICIO', 'TABLOIDE'].filter(t => activos[t.toLowerCase()] !== false).filter(t => !(servicioForm.tipo === 'ESCANEO' && t === 'TABLOIDE')); return tamanos.length > 1 ? (
                                        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border dark:border-slate-600 mb-3">
                                            {tamanos.map(tam => (<button key={tam} onClick={() => setServicioForm({...servicioForm, tamano: tam})} className={`flex-1 py-1 text-[10px] rounded font-bold transition-all ${servicioForm.tamano === tam ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm transform scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>{tam}</button>))}
                                        </div>
                                    ) : null; })()}
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
                            {carrito.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                                    <ShoppingBag size={48} className="mb-2 stroke-1"/>
                                    <span className="text-xs font-medium">Carrito vacío</span>
                                </div>
                            ) : (
                                carrito.map((i) => (
                                    <div key={i.uid} className="bg-white dark:bg-slate-700 p-2 sm:p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 flex justify-between items-center group transition-all hover:border-orange-300 min-h-[58px]">
                                        <div className="flex-1 min-w-0 pr-1">
                                            <div className="font-bold text-sm text-slate-800 dark:text-white truncate">{i.nombre}</div>
                                            <div className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">{i.cantidad} x ${i.precio.toFixed(2)}</div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                            {/* Acciones al posar el ratón */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button onClick={() => disminuirCantidad(i.uid)} className="p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-md hover:bg-amber-500 hover:text-white transition-colors shadow-sm" title="Quitar 1">
                                                    <Minus size={14} strokeWidth={3}/>
                                                </button>
                                                <button onClick={() => incrementarCantidad(i.uid)} className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-md hover:bg-emerald-500 hover:text-white transition-colors shadow-sm" title="Agregar 1">
                                                    <PlusCircle size={14} strokeWidth={3}/>
                                                </button>
                                                <button onClick={() => eliminarItem(i.uid)} className="p-1.5 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-md hover:bg-rose-500 hover:text-white transition-colors shadow-sm" title="Quitar todo el conjunto">
                                                    <X size={14} strokeWidth={3}/>
                                                </button>
                                            </div>
                                            <div className="font-black text-emerald-600 dark:text-emerald-400 text-[13px] sm:text-sm whitespace-nowrap text-right min-w-[3rem]">
                                                ${(i.precio * (i.cantidad || 1)).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
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