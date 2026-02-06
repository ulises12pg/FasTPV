import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { generarReporteCaja } from '../../utils/ticketGenerator';
import { Wallet, X } from 'lucide-react';

export default function CajaModal() {
    const { 
        caja, setCaja, 
        ventas, 
        setCortes, 
        usuarioActual, 
        setModalAbierto, 
        addToast 
    } = useSystem();

    const [cajaForm, setCajaForm] = useState({ fondo: '' });

    const obtenerVentasTurno = () => {
        if (!caja.inicio) return [];
        return ventas.filter(v => new Date(v.fecha) >= new Date(caja.inicio));
    };

    const abrirCaja = () => {
        if (!cajaForm.fondo) return addToast("Ingresa un fondo inicial", 'warning');
        setCaja({ activa: true, fondo: parseFloat(cajaForm.fondo), inicio: new Date().toISOString() });
        setCajaForm({ fondo: '' });
        addToast("Turno iniciado correctamente.", 'success');
    };

    const cerrarCaja = () => {
        if(window.confirm("¿Seguro que deseas cerrar el turno y hacer corte? Se generará el reporte PDF.")) {
            const ventasTurno = obtenerVentasTurno();
            const totalVentas = ventasTurno.reduce((acc, v) => acc + (v.cancelada ? 0 : v.total), 0);
            
            const nuevoCorte = {
                id: Date.now(),
                fecha: new Date().toISOString(),
                inicio: caja.inicio,
                fondo: caja.fondo,
                totalVentas: totalVentas,
                totalCaja: caja.fondo + totalVentas,
                usuario: usuarioActual.nombre,
                ventasSnapshot: ventasTurno // Guardamos snapshot para reimpresión exacta
            };
            
            setCortes(prev => [nuevoCorte, ...prev]);
            generarReporteCaja(caja, ventasTurno); // Generar PDF Carta
            
            setCaja({ activa: false, fondo: 0, inicio: null });
            addToast("Turno cerrado. Reporte generado.", 'success');
            setModalAbierto(null);
        }
    };

    const ventasTurno = obtenerVentasTurno();
    const totalVentasTurno = ventasTurno.reduce((acc, v) => acc + (v.cancelada ? 0 : v.total), 0);

    return (
        <div className="fixed inset-0 bg-slate-500/30 backdrop-blur-sm flex items-center justify-center z-[80] fade-anim">
            <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden modal-anim border border-white/20">
                <div className="p-4 border-b border-slate-200/50 flex justify-between items-center"><h2 className="font-bold flex items-center gap-2 text-slate-800"><Wallet className="text-blue-500"/> Control de Caja</h2><button onClick={() => setModalAbierto(null)} className="p-1 rounded-full hover:bg-slate-100"><X size={20} className="text-slate-500"/></button></div>
                
                {caja.activa ? (
                    <div className="p-6">
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl text-center mb-4">
                            <p className="text-sm text-emerald-700 font-bold uppercase">Turno Activo Desde</p>
                            <p className="text-xs text-slate-500">{new Date(caja.inicio).toLocaleString()}</p>
                        </div>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center border-b pb-2"><span className="text-slate-500">Fondo Inicial</span><span className="font-bold text-lg">${caja.fondo.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center border-b pb-2"><span className="text-slate-500">Ventas Turno ({ventasTurno.length})</span><span className="font-bold text-lg text-indigo-600">+${totalVentasTurno.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center bg-slate-100 p-2 rounded"><span className="text-slate-700 font-bold">TOTAL EN CAJA</span><span className="font-black text-2xl text-slate-800">${(caja.fondo + totalVentasTurno).toFixed(2)}</span></div>
                        </div>
                        <button onClick={cerrarCaja} className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-rose-500/30 transition-all">Cerrar Turno / Corte de Caja</button>
                    </div>
                ) : (
                    <div className="p-6">
                        <p className="text-sm text-slate-500 mb-4 text-center">La caja está cerrada. Ingresa el fondo inicial para comenzar.</p>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Monto Fondo Inicial</label>
                        <div className="relative mb-6"><span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span><input type="number" className="w-full border border-slate-200 bg-transparent rounded-xl p-2 pl-8 text-lg font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="0.00" value={cajaForm.fondo} onChange={e => setCajaForm({...cajaForm, fondo: e.target.value})} autoFocus /></div>
                        <button onClick={abrirCaja} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all">Iniciar Turno</button>
                    </div>
                )}
            </div>
        </div>
    );
}