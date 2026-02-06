import React, { useMemo } from 'react';
import { useSystem } from '../../context/SystemContext';
import { generarTicket, generarReporteCaja } from '../../utils/ticketGenerator';
import { History, X, Ticket, Printer, Ban, FileClock, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HistorialModal() {
    const { 
        modalAbierto, setModalAbierto, 
        ventas, setVentas, 
        cortes, 
        catalogo, setCatalogo, 
        clientes, setClientes, 
        usuarioActual, 
        config, 
        addToast,
        usuarios
    } = useSystem();

    if (modalAbierto !== 'historial') return null;

    const cancelarVenta = (id) => {
        if (usuarioActual.rol !== 'admin') return addToast("Acceso denegado. Solo administradores.", 'error');
        const venta = ventas.find(v => v.id === id);
        if (!venta) return;
        if (venta.cancelada) return addToast("Esta venta ya está cancelada.", 'warning');
        
        // Validar que sea del mismo día
        const hoy = new Date().toDateString();
        const fechaVenta = new Date(venta.fecha).toDateString();
        if (hoy !== fechaVenta) return addToast("Solo se pueden cancelar ventas del día actual.", 'warning');
        
        if (window.confirm(`¿Cancelar venta Folio ${venta.id.toString().slice(-4)} de $${venta.total.toFixed(2)}?\nSe devolverá el stock y los puntos.`)) {
            // 1. Devolver Stock
            const nCat = [...catalogo];
            (venta.productos || []).forEach(p => {
                if (p.idCatalogo) {
                    const idx = nCat.findIndex(c => c.id === p.idCatalogo);
                    if (idx !== -1) nCat[idx].stock += (p.cantidad || 1);
                }
            });
            setCatalogo(nCat);
            
            // 2. Retirar Puntos (si aplica)
            if (venta.puntosGanados > 0) {
                const clienteNombre = venta.cliente;
                setClientes(prev => prev.map(c => {
                    if (c.nombre === clienteNombre) {
                        return { ...c, puntos: Math.max(0, (c.puntos || 0) - venta.puntosGanados) };
                    }
                    return c;
                }));
            }
            
            // 3. Marcar cancelada
            setVentas(prev => prev.map(v => v.id === id ? { ...v, cancelada: true } : v));
            addToast("Venta cancelada correctamente.", 'success');
        }
    };

    const reimprimirCorte = (corte) => {
        // Reconstruir objeto caja simulado para el reporte
        const cajaSimulada = { fondo: corte.fondo, inicio: corte.inicio, fechaCierre: corte.fecha };
        // Buscar info del usuario (rol)
        const usuarioCorte = usuarios.find(u => u.nombre === corte.usuario) || { nombre: corte.usuario, rol: 'N/A' };
        generarReporteCaja(cajaSimulada, corte.ventasSnapshot || [], usuarioCorte, config);
    };

    const exportarCSV = () => {
        if (ventas.length === 0) return addToast("No hay ventas para exportar", 'warning');

        const headers = ["Folio", "Fecha", "Hora", "Cliente", "Equipo", "Total", "Puntos", "Atendido Por", "Estado"];
        const rows = ventas.map(v => {
            const d = new Date(v.fecha);
            return [
                v.folio || v.id,
                d.toLocaleDateString(),
                d.toLocaleTimeString(),
                `"${v.cliente.replace(/"/g, '""')}"`,
                `"${v.equipo}"`,
                v.total.toFixed(2),
                v.puntosGanados,
                `"${v.atendio}"`,
                v.cancelada ? "CANCELADA" : "OK"
            ].join(",");
        });

        const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Ventas_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast("Historial exportado a Excel (CSV)", 'success');
    };

    // --- DATOS PARA EL GRÁFICO ---
    const dataGrafico = useMemo(() => {
        // Generar últimos 7 días
        const ultimosDias = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d;
        }).reverse();

        return ultimosDias.map(date => {
            const dateStr = date.toLocaleDateString(); // Formato local para comparar
            const totalDia = ventas.reduce((acc, v) => {
                if (v.cancelada) return acc;
                // Comparamos fechas locales para agrupar correctamente
                if (new Date(v.fecha).toLocaleDateString() === dateStr) {
                    return acc + v.total;
                }
                return acc;
            }, 0);
            
            return {
                name: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }), // Ej: "lun 10"
                total: totalDia
            };
        });
    }, [ventas]);

    return (
        <div className="fixed inset-0 bg-slate-500/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-anim">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col modal-anim border border-white/20 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200/50 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                    <h2 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white"><History className="text-blue-500"/> Historial de Operaciones</h2>
                    <div className="flex gap-2">
                        <button onClick={exportarCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm">
                            <Download size={16}/> Exportar Excel
                        </button>
                        <button onClick={() => setModalAbierto(null)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><X size={20} className="text-slate-500"/></button>
                    </div>
                </div>
                
                <div className="flex flex-1 overflow-hidden flex-col">
                    {/* SECCIÓN GRÁFICO */}
                    <div className="h-64 w-full p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 shrink-0">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Ventas Últimos 7 Días</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataGrafico}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b', fontSize: 12 }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b', fontSize: 12 }} 
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                    {/* COLUMNA 1: VENTAS RECIENTES */}
                    <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800"><h3 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm flex items-center gap-2"><Ticket size={16}/> Ventas Recientes</h3></div>
                        <div className="flex-1 overflow-y-auto p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold sticky top-0"><tr><th className="p-3">Folio</th><th className="p-3">Hora</th><th className="p-3">Cliente</th><th className="p-3 text-right">Total</th><th className="p-3 text-center">Acción</th></tr></thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {[...ventas].sort((a,b) => b.id - a.id).slice(0, 50).map(v => (
                                        <tr key={v.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${v.cancelada ? 'opacity-50 bg-slate-50 dark:bg-slate-800/50' : ''}`}>
                                            <td className="p-3 font-mono text-xs text-slate-500">{v.id.toString().slice(-4)}</td>
                                            <td className="p-3 text-slate-600 dark:text-slate-300 text-xs">{new Date(v.fecha).toLocaleDateString()} {new Date(v.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                            <td className="p-3 font-medium text-slate-800 dark:text-white truncate max-w-[100px]">{v.cliente}</td>
                                            <td className={`p-3 text-right font-bold ${v.cancelada ? 'text-slate-400 line-through' : 'text-emerald-600 dark:text-emerald-400'}`}>${v.total.toFixed(2)}</td>
                                            <td className="p-3 text-center">
                                                {v.cancelada ? <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-bold">CANCELADA</span> : (
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => generarTicket(v, config)} className="text-slate-400 hover:text-blue-500" title="Reimprimir"><Printer size={16}/></button>
                                                        {usuarioActual.rol === 'admin' && new Date(v.fecha).toDateString() === new Date().toDateString() && (
                                                            <button onClick={() => cancelarVenta(v.id)} className="text-slate-400 hover:text-rose-500" title="Cancelar Venta"><Ban size={16}/></button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* COLUMNA 2: HISTORIAL CORTES */}
                    <div className="w-full md:w-1/3 flex flex-col bg-slate-50 dark:bg-slate-800/50">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800"><h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2"><FileClock size={16}/> Cortes de Caja Anteriores</h3></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cortes.length === 0 ? <div className="text-center text-slate-400 py-10 text-sm">No hay cortes registrados</div> : cortes.map(c => (
                                <div key={c.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div><div className="font-bold text-slate-700 dark:text-white text-sm">{new Date(c.fecha).toLocaleDateString()}</div><div className="text-xs text-slate-400">{new Date(c.fecha).toLocaleTimeString()}</div></div>
                                        <button onClick={() => reimprimirCorte(c)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded transition-colors" title="Reimprimir Reporte"><Printer size={16}/></button>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1"><span>Fondo Inicial:</span><span>${c.fondo.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1"><span>Ventas:</span><span className="text-emerald-600 font-bold">+${c.totalVentas.toFixed(2)}</span></div>
                                    <div className="border-t dark:border-slate-700 mt-2 pt-2 flex justify-between font-bold text-sm text-slate-800 dark:text-white"><span>Total Caja:</span><span>${c.totalCaja.toFixed(2)}</span></div>
                                    <div className="mt-2 text-[10px] text-slate-400 text-right">Por: {c.usuario}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
}