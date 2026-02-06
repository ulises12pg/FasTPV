import React, { useState, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { generarTicket } from '../../utils/ticketGenerator';
import { RATIO_PUNTOS } from '../../constants/initialData';
import { generarFolio } from '../../utils/folioGenerator';
import { Ticket, X, CheckCircle, CircleDollarSign } from 'lucide-react';

export default function CobrarModal() {
    const { 
        modalAbierto, setModalAbierto, 
        equipoSeleccionadoId, 
        equipos, setEquipos, 
        clientes, setClientes, 
        catalogo, setCatalogo, 
        ventas, setVentas, 
        usuarioActual, 
        config, 
        addToast, 
        playSound 
    } = useSystem();

    const [checkoutData, setCheckoutData] = useState({ clienteId: 1, pagoCon: '' });
    const [procesando, setProcesando] = useState(false);

    // Resetear estado al abrir
    useEffect(() => {
        if (modalAbierto === 'cobrar') {
            setCheckoutData({ clienteId: 1, pagoCon: '' });
            setProcesando(false);
        }
    }, [modalAbierto]);

    if (modalAbierto !== 'cobrar' || !equipoSeleccionadoId) return null;

    const eqSel = equipos.find(e => e.id === equipoSeleccionadoId);
    if (!eqSel) return null;

    // --- Helpers de Cálculo ---
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

    const procesarCobro = async () => {
        setProcesando(true);
        await new Promise(resolve => setTimeout(resolve, 600));

        const subRenta = calcularTotalRenta(eqSel);
        const subProd = eqSel.cuenta.reduce((a, i) => a + (i.precio * (i.cantidad || 1)), 0); 
        const total = subRenta + subProd;
        const pagoCon = parseFloat(checkoutData.pagoCon) || 0;
        const cambio = pagoCon - total;

        const cliente = clientes.find(c => c.id === parseInt(checkoutData.clienteId)) || { id: 1, nombre: 'Público General', puntos: 0 };
        let puntosGanados = 0;
        
        if (cliente.id !== 1) { 
            puntosGanados = Math.floor(total * RATIO_PUNTOS);
            setClientes(prev => prev.map(c => c.id === cliente.id ? { ...c, puntos: (c.puntos || 0) + puntosGanados } : c));
            if(puntosGanados > 0) addToast(`🎉 ¡${cliente.nombre} ganó ${puntosGanados} Puntos!`, 'success');
        }
        
        const nCat = [...catalogo];
        eqSel.cuenta.forEach(i => { if (i.idCatalogo) { const idx = nCat.findIndex(p => p.id === i.idCatalogo); if (idx !== -1) nCat[idx].stock = Math.max(0, nCat[idx].stock - 1); } });
        setCatalogo(nCat);

        const nuevoFolio = generarFolio(config, ventas);

        const venta = { 
            id: Date.now(), 
            folio: nuevoFolio,
            fecha: new Date().toISOString(), 
            equipo: eqSel.nombre, 
            cliente: cliente.nombre, 
            total, 
            puntosGanados, 
            productos: eqSel.cuenta, 
            subtotalRenta: subRenta, 
            pagoCon: pagoCon, 
            cambio: cambio, 
            atendio: usuarioActual.nombre, 
            cancelada: false 
        };
        
        setVentas(prev => [...prev, venta]);
        setEquipos(prev => prev.map(e => e.id === eqSel.id ? { ...e, estado: 'libre', inicio: null, tiempoAcumulado: 0, cuenta: [], modo: 'libre', limiteTiempo: 0, alertaMinuto: false } : e));
        
        setModalAbierto(null);
        generarTicket(venta, config);
        playSound('success');
        setProcesando(false);
    };

    const subRenta = calcularTotalRenta(eqSel);
    const subProd = eqSel.cuenta.reduce((a, i) => a + (i.precio * (i.cantidad || 1)), 0);
    const total = subRenta + subProd;
    const pagoCon = parseFloat(checkoutData.pagoCon) || 0;

    return (
        <div className="fixed inset-0 bg-slate-500/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-anim">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md modal-anim border border-white/20 dark:border-slate-700">
                <div className="bg-slate-800 p-4 text-white flex justify-between items-center rounded-t-xl"><h2 className="font-bold flex items-center gap-2"><Ticket className="text-emerald-400" /> Checkout</h2><button onClick={() => setModalAbierto(null)} className="p-1 rounded-full hover:bg-slate-700 transition-colors"><X size={20}/></button></div>
                <div className="p-6 space-y-4">
                    <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Cliente</label><select className="w-full border dark:border-slate-600 p-2 rounded mt-1 text-sm bg-slate-50 dark:bg-slate-800 dark:text-white" value={checkoutData.clienteId || 1} onChange={e => setCheckoutData({ ...checkoutData, clienteId: parseInt(e.target.value) })}>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.id !== 1 ? `(${c.puntos} pts)` : ''}</option>)}</select></div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded border dark:border-slate-700 space-y-2 text-sm">
                        <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Renta</span><span>${subRenta.toFixed(2)}</span></div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Productos</span><span>${subProd.toFixed(2)}</span></div>
                        <div className="border-t dark:border-slate-600 pt-2 flex justify-between items-center text-lg font-bold text-slate-800 dark:text-white"><span>TOTAL</span><span>${total.toFixed(2)}</span></div>
                        
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                            <div className="flex items-center gap-2 mb-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 w-20">Paga con:</label>
                                <input type="number" className="flex-1 border dark:border-slate-600 bg-white dark:bg-slate-900 p-1 rounded text-sm font-bold text-right dark:text-white" placeholder="$0.00" value={checkoutData.pagoCon} onChange={e => setCheckoutData({...checkoutData, pagoCon: e.target.value})}/>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 w-20">Cambio:</label>
                                <div className="flex-1 text-right text-lg font-black text-emerald-600">${(pagoCon - total).toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                    {checkoutData.clienteId !== 1 ? (<div className="text-center text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded border border-emerald-100 dark:border-emerald-800">Este cliente ganará <b>{Math.floor(total * RATIO_PUNTOS)}</b> puntos con esta compra.</div>) : (<div className="text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">Público General: <b>No acumula puntos</b>.</div>)}
                    <button onClick={procesarCobro} disabled={procesando || pagoCon < total} className={`w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 shadow-lg flex justify-center items-center gap-2 ${(procesando || pagoCon < total) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
                        {procesando ? <div className="spinner" style={{borderColor: 'rgba(255,255,255,0.3)', borderLeftColor: '#fff'}}></div> : <><CheckCircle /> Terminar y Cobrar</>}
                    </button>
                </div>
            </div>
        </div>
    );
}