import React, { useState, useEffect, useRef } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Package, X, Camera, CameraOff, ScanBarcode, Save, Edit2, Trash2, QrCode, Search } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function InventarioModal() {
    const { modalAbierto, setModalAbierto, catalogo, setCatalogo, addToast, playSound } = useSystem();
    const [itemForm, setItemForm] = useState({ id: null, nombre: '', precio: '', stock: '', categoria: 'General', codigo: '' });
    const [showCamera, setShowCamera] = useState(false);
    const html5QrCodeRef = useRef(null);
    const [busqueda, setBusqueda] = useState('');
    
    // Refs para Scanner físico (Buffer de teclado)
    const barcodeBuffer = useRef('');
    const lastKeyTime = useRef(0);

    // Si no está abierto, no renderizar nada
    if (modalAbierto !== 'inventario') return null;

    const handleBarcodeScan = (code) => {
        playSound('scan');
        const producto = catalogo.find(p => p.codigo === code);
        if (producto) {
            setItemForm(producto);
            addToast("Producto encontrado", 'success');
        } else {
            setItemForm(prev => ({ ...prev, id: null, nombre: '', precio: '', stock: '', categoria: 'General', codigo: code, icon: '📦' }));
            playSound('warning');
            addToast("Código nuevo escaneado", 'info');
        }
    };

    // --- EFECTO: Scanner Físico (Teclado) ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            const currentTime = Date.now();
            if (currentTime - lastKeyTime.current > 100) barcodeBuffer.current = '';
            lastKeyTime.current = currentTime;

            if (e.key === 'Enter') {
                if (barcodeBuffer.current.length > 0) {
                    handleBarcodeScan(barcodeBuffer.current);
                    barcodeBuffer.current = '';
                }
            } else if (e.key.length === 1 && document.activeElement.tagName !== 'INPUT') {
                barcodeBuffer.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [catalogo]); // Dependencia catalogo para buscar productos actualizados

    // --- EFECTO: Cámara (Html5Qrcode) ---
    useEffect(() => {
        if (showCamera) {
            const startCamera = async () => {
                try {
                    if(!document.getElementById("reader")) return;
                    
                    const html5QrCode = new Html5Qrcode("reader");
                    html5QrCodeRef.current = html5QrCode;
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        (decodedText) => {
                             handleBarcodeScan(decodedText);
                        },
                        (errorMessage) => { /* Ignorar errores de frame vacío */ }
                    );
                } catch (err) {
                    console.error(err);
                    addToast("Error al iniciar cámara. Verifique permisos.", 'error');
                    setShowCamera(false);
                }
            };
            const timer = setTimeout(startCamera, 300); // Delay para asegurar renderizado del div
            return () => {
                clearTimeout(timer);
                stopCamera();
            };
        } else {
            stopCamera();
        }
    }, [showCamera]);

    const stopCamera = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (e) { /* Ignorar errores al detener si no estaba corriendo */ }
            html5QrCodeRef.current = null;
        }
    };

    const guardarProductoInventario = () => {
        if (!itemForm.nombre || !itemForm.precio) return addToast("Faltan datos (Nombre y Precio)", 'warning');
        
        const nuevo = { 
            ...itemForm, 
            id: itemForm.id || Date.now(), 
            precio: parseFloat(itemForm.precio), 
            stock: parseInt(itemForm.stock) || 0, 
            icon: itemForm.categoria === 'Bebidas' ? '🥤' : '📦' 
        };

        if (itemForm.id) {
            setCatalogo(prev => prev.map(p => p.id === itemForm.id ? { ...p, ...nuevo } : p));
            addToast("Producto actualizado", 'success');
        } else {
            setCatalogo(prev => [...prev, nuevo]);
            addToast("Producto agregado", 'success');
        }
        
        setItemForm({ id: null, nombre: '', precio: '', stock: '', categoria: 'General', codigo: '' });
        if(showCamera) playSound('success');
    };

    const eliminarProductoInventario = (id) => { 
        if(window.confirm("¿Eliminar este producto del inventario?")) {
            setCatalogo(prev => prev.filter(p => p.id !== id));
            addToast("Producto eliminado", 'info');
        }
    };

    const cerrarModal = () => {
        stopCamera();
        setShowCamera(false);
        setModalAbierto(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-anim">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl modal-anim border dark:border-slate-700 overflow-hidden">
                <div className="bg-indigo-700 p-4 text-white flex justify-between items-center shrink-0"><h2 className="font-bold flex items-center gap-2"><Package /> Inventario</h2><button onClick={cerrarModal} className="hover:bg-indigo-600 p-1 rounded-full transition-colors"><X/></button></div>
                
                <div className="flex-1 p-6 bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row gap-6 overflow-hidden">
                    {/* Formulario */}
                    <div className="w-full md:w-1/3 bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm border dark:border-slate-700 h-fit space-y-4 overflow-y-auto shrink-0">
                        <h3 className="font-bold text-slate-700 dark:text-white border-b dark:border-slate-700 pb-2 flex justify-between items-center">{itemForm.id ? "Editar Producto" : "Nuevo Producto"} {itemForm.id && <button onClick={() => setItemForm({ id: null, nombre: '', precio: '', stock: '', categoria: 'General', codigo: '' })} className="text-xs text-indigo-600 dark:text-indigo-400 underline">Cancelar</button>}</h3>
                        
                        <div className="border rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden relative"><button onClick={() => setShowCamera(!showCamera)} className={`w-full py-2 text-xs font-bold flex justify-center items-center gap-2 transition-colors ${showCamera ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>{showCamera ? <><CameraOff size={14}/> Detener Cámara</> : <><Camera size={14}/> Usar Cámara / QR</>}</button>{showCamera && <div id="reader" className="w-full h-48 bg-black"></div>}</div>

                        <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">Producto</label><input className="w-full border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white p-2 rounded mt-1 outline-none focus:border-indigo-500 transition-all" value={itemForm.nombre} onChange={e => setItemForm({...itemForm, nombre: e.target.value})} placeholder="Ej. Coca Cola" /></div>
                        <div className="flex gap-2"><div className="flex-1"><label className="text-xs font-bold text-slate-500 dark:text-slate-400">Precio</label><input type="number" className="w-full border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white p-2 rounded mt-1 outline-none focus:border-indigo-500 transition-all" value={itemForm.precio} onChange={e => setItemForm({...itemForm, precio: e.target.value})} placeholder="0.00" /></div><div className="flex-1"><label className="text-xs font-bold text-slate-500 dark:text-slate-400">Stock</label><input type="number" className="w-full border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white p-2 rounded mt-1 outline-none focus:border-indigo-500 transition-all" value={itemForm.stock} onChange={e => setItemForm({...itemForm, stock: e.target.value})} placeholder="0" /></div></div>
                        <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">Categoría</label><select className="w-full border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white p-2 rounded mt-1 outline-none focus:border-indigo-500 transition-all" value={itemForm.categoria} onChange={e => setItemForm({...itemForm, categoria: e.target.value})}><option value="General">General</option><option value="Bebidas">Bebidas</option><option value="Snacks">Snacks</option><option value="Papelería">Papelería</option><option value="Tecnología">Tecnología</option></select></div>
                        <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">Código de Barras</label><div className="relative"><input className="w-full border dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white p-2 pl-8 rounded mt-1 outline-none focus:border-indigo-500 transition-all" value={itemForm.codigo} onChange={e => setItemForm({...itemForm, codigo: e.target.value})} placeholder="Escanear..." /><ScanBarcode size={16} className="absolute left-2.5 top-4 text-slate-400"/></div></div>
                        <button onClick={guardarProductoInventario} className="w-full bg-indigo-600 text-white py-2.5 rounded font-bold hover:bg-indigo-700 shadow transition-all flex justify-center items-center gap-2"><Save size={18}/> Guardar</button>
                    </div>

                    {/* Tabla */}
                    <div className="w-full md:w-2/3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 overflow-hidden flex flex-col">
                        {/* Barra de Búsqueda */}
                        <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-2.5 text-slate-400"/>
                                <input 
                                    className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 p-2 pl-9 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all dark:text-white" 
                                    placeholder="Buscar por nombre o código..." 
                                    value={busqueda} 
                                    onChange={e => setBusqueda(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const term = busqueda.trim();
                                            if (term) {
                                                handleBarcodeScan(term);
                                                setBusqueda('');
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <table className="w-full text-sm text-left text-slate-700 dark:text-slate-200">
                                <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold sticky top-0 shadow-sm z-10"><tr><th className="p-3">Producto</th><th className="p-3">Categoría</th><th className="p-3">Precio</th><th className="p-3 text-center">Stock</th><th className="p-3 text-center">Acciones</th></tr></thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {catalogo.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (p.codigo && p.codigo.includes(busqueda))).map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 group transition-colors">
                                            <td className="p-3 font-medium flex items-center gap-2"><span className="text-lg">{p.icon}</span> <div><div className="font-bold">{p.nombre}</div><div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">{p.codigo ? <><QrCode size={10}/> {p.codigo}</> : 'Sin código'}</div></div></td>
                                            <td className="p-3 text-slate-500 dark:text-slate-400"><span className="bg-slate-100 dark:bg-slate-600 px-2 py-0.5 rounded-full text-xs">{p.categoria}</span></td>
                                            <td className="p-3 font-bold text-slate-700 dark:text-slate-200">${p.precio.toFixed(2)}</td>
                                            <td className="p-3 text-center"><span className={`font-bold px-2 py-0.5 rounded text-xs ${p.stock < 5 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>{p.stock}</span></td>
                                            <td className="p-3"><div className="flex justify-center gap-2"><button onClick={() => setItemForm(p)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors" title="Editar"><Edit2 size={16}/></button><button onClick={() => eliminarProductoInventario(p.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors" title="Eliminar"><Trash2 size={16}/></button></div></td>
                                        </tr>
                                    ))}
                                    {catalogo.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-400">No hay productos en el inventario.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}