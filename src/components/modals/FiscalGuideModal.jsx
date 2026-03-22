import React, { useState, useMemo } from 'react';
import { useSystem } from '../../context/SystemContext';
import { FileText, X, Calculator, Copy, CheckCircle, Info, Landmark } from 'lucide-react';

export default function FiscalGuideModal() {
    const { modalAbierto, setModalAbierto, ventas, config, addToast } = useSystem();
    const [tipoGuia, setTipoGuia] = useState('global'); // 'global' | 'moral'
    const [montoManual, setMontoManual] = useState('');
    const [incluyeIVA, setIncluyeIVA] = useState(true);

    if (modalAbierto !== 'fiscalGuide') return null;

    // --- CÁLCULO FACTURA GLOBAL ---
    const ventasGlobal = useMemo(() => {
        // Filtrar ventas del mes actual, no canceladas
        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const anioActual = hoy.getFullYear();

        const validas = ventas.filter(v => {
            if (v.cancelada || v.facturada) return false;
            const d = new Date(v.fecha);
            return d.getMonth() === mesActual && d.getFullYear() === anioActual;
        });

        const totalNeto = validas.reduce((acc, v) => acc + v.total, 0);
        // Desglosar IVA (Factor 1.16)
        const subtotal = totalNeto / 1.16;
        const iva = totalNeto - subtotal;

        return {
            cantidadTickets: validas.length,
            totalNeto,
            subtotal,
            iva,
            tickets: validas.map(v => ({ id: v.id, total: v.total }))
        };
    }, [ventas]);

    // --- CÁLCULO FACTURA PM (RESICO) ---
    const calcPM = () => {
        let monto = parseFloat(montoManual) || 0;
        let subtotal = 0;
        if (incluyeIVA) subtotal = monto / 1.16;
        else subtotal = monto;

        const iva = subtotal * 0.16;
        const retISR = subtotal * 0.0125; // RESICO Retención ISR 1.25%
        const totalPagar = subtotal + iva - retISR;

        return { subtotal, iva, retISR, totalPagar };
    };
    const pmDatos = calcPM();

    const copiarAlPortapapeles = (texto, nombreCampo) => {
        navigator.clipboard.writeText(texto.toString());
        addToast(`${nombreCampo} copiado al portapapeles`, 'success');
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-anim"
            onClick={(e) => e.target === e.currentTarget && setModalAbierto(null)}
        >
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden modal-anim border dark:border-slate-700">
                <div className="bg-purple-700 p-4 text-white flex justify-between items-center shrink-0">
                    <h2 className="font-bold flex items-center gap-2 text-lg"><Landmark /> Guía de Facturación SAT</h2>
                    <button onClick={() => setModalAbierto(null)} className="hover:bg-purple-600 p-1.5 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 flex gap-4 shrink-0">
                    <button 
                        onClick={() => setTipoGuia('global')} 
                        className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${tipoGuia === 'global' ? 'bg-purple-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border dark:border-slate-600 hover:bg-slate-100'}`}
                    >
                        <FileText size={18} /> Factura Global Mensual (Público Gral)
                    </button>
                    <button 
                        onClick={() => setTipoGuia('moral')} 
                        className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${tipoGuia === 'moral' ? 'bg-purple-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border dark:border-slate-600 hover:bg-slate-100'}`}
                    >
                        <Calculator size={18} /> Calculadora Retenciones (Persona Moral)
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50 relative custom-scrollbar">
                    {tipoGuia === 'global' ? (
                        <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 flex gap-3 text-blue-800 dark:text-blue-300 text-sm">
                                <Info className="shrink-0" />
                                <p><strong>Instrucciones Portal SAT:</strong> Selecciona cliente "Público en General" (RFC: XAXX010101000). Régimen 616 y Uso CFDI S01. Ingresa a continuación los importes calculados a partir de los tickets huérfanos del mes.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 pb-2">Datos del Receptor</h3>
                                    
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border dark:border-slate-700 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-bold">RFC</span>
                                            <div className="flex items-center gap-2"><span className="font-mono text-sm dark:text-white">XAXX010101000</span> <button onClick={() => copiarAlPortapapeles('XAXX010101000', 'RFC')} className="text-slate-400 hover:text-purple-600"><Copy size={14}/></button></div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-bold">Nombre</span>
                                            <div className="flex items-center gap-2"><span className="font-mono text-sm dark:text-white">PUBLICO EN GENERAL</span> <button onClick={() => copiarAlPortapapeles('PUBLICO EN GENERAL', 'Nombre')} className="text-slate-400 hover:text-purple-600"><Copy size={14}/></button></div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-bold">Uso CFDI</span>
                                            <span className="text-sm dark:text-white">S01 - Sin efectos fiscales</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-bold">Régimen</span>
                                            <span className="text-sm dark:text-white">616 - Sin obligaciones fiscales</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-bold">C.P. (Domicilio)</span>
                                            <span className="text-sm dark:text-white text-right">Mismo que el Emisor<br/><span className="text-[10px] text-slate-400">(El de tu sucursal)</span></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 pb-2">Montos a Reportar (Nodos)</h3>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border dark:border-slate-700 space-y-4">
                                        <div className="text-center bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-lg p-3 mb-2">
                                            <div className="text-xs text-slate-500 font-bold uppercase mb-1">Tickets sin facturar este mes</div>
                                            <div className="text-3xl font-black text-slate-800 dark:text-white">{ventasGlobal.cantidadTickets}</div>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600 dark:text-slate-300 font-bold">Subtotal (Base)</span>
                                            <div className="flex items-center gap-2"><span className="font-mono font-bold text-lg dark:text-white">{ventasGlobal.subtotal.toFixed(2)}</span> <button onClick={() => copiarAlPortapapeles(ventasGlobal.subtotal.toFixed(2), 'Subtotal')} className="text-slate-400 hover:text-purple-600"><Copy size={16}/></button></div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Impuesto Trasladado (IVA 16%)</span>
                                            <div className="flex items-center gap-2"><span className="font-mono dark:text-slate-300">{ventasGlobal.iva.toFixed(2)}</span> <button onClick={() => copiarAlPortapapeles(ventasGlobal.iva.toFixed(2), 'IVA')} className="text-slate-400 hover:text-purple-600"><Copy size={14}/></button></div>
                                        </div>
                                        <div className="border-t dark:border-slate-600 pt-3 flex justify-between items-center">
                                            <span className="text-sm font-black text-slate-800 dark:text-white uppercase">Total Ticket(s)</span>
                                            <span className="font-mono font-black text-xl text-purple-600 dark:text-purple-400">${ventasGlobal.totalNeto.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-400 text-center">Datos calculados extrayendo el IVA (Dividiendo entre 1.16). Asegúrate de agregar cada número de ticket en la descripción si usas la opción de Nodos individuales en el SAT.</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-xl mx-auto space-y-6">
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 flex gap-3 text-amber-800 dark:text-amber-300 text-sm">
                                <Info className="shrink-0" />
                                <p><strong>Calculadora RESICO:</strong> Si eres persona física en RESICO y facturas a una Persona Moral (Ej. S.A. de C.V.), debes retener el 1.25% de ISR. Ingresa el monto a cobrar por el servicio para desglosar IVA y Retenciones.</p>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700">
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Monto del Servicio</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex-1">
                                            <span className="absolute left-4 top-3.5 text-slate-400 font-bold">$</span>
                                            <input 
                                                type="number"
                                                className="w-full pl-8 p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 focus:border-purple-500 outline-none font-bold text-lg dark:text-white"
                                                placeholder="0.00"
                                                value={montoManual}
                                                onChange={e => setMontoManual(e.target.value)}
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input type="checkbox" className="w-5 h-5 accent-purple-600 rounded" checked={incluyeIVA} onChange={e => setIncluyeIVA(e.target.checked)} />
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Ya incluye IVA</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="border-t border-dashed dark:border-slate-700 pt-6 space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-slate-600 dark:text-slate-300">Subtotal</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-slate-800 dark:text-white">${pmDatos.subtotal.toFixed(2)}</span>
                                            <button onClick={() => copiarAlPortapapeles(pmDatos.subtotal.toFixed(2), 'Subtotal')} className="text-slate-400 hover:text-purple-600"><Copy size={16}/></button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">IVA Trasladado (16%)</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono dark:text-slate-300">${pmDatos.iva.toFixed(2)}</span>
                                            <button onClick={() => copiarAlPortapapeles(pmDatos.iva.toFixed(2), 'IVA')} className="text-slate-400 hover:text-purple-600"><Copy size={16}/></button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm bg-rose-50 dark:bg-rose-900/10 p-2 rounded-lg">
                                        <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">Efectúa Retención (ISR 1.25%)</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-rose-600 font-bold">-${pmDatos.retISR.toFixed(2)}</span>
                                            <button onClick={() => copiarAlPortapapeles(pmDatos.retISR.toFixed(2), 'Retención ISR')} className="text-rose-400 hover:text-rose-600"><Copy size={16}/></button>
                                        </div>
                                    </div>
                                    <div className="border-t dark:border-slate-600 pt-4 flex justify-between items-center">
                                        <span className="font-black uppercase text-slate-800 dark:text-white">Total a Pagar (Efectivo/TDD)</span>
                                        <span className="font-mono font-black text-2xl text-emerald-600 dark:text-emerald-400">${pmDatos.totalPagar.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
