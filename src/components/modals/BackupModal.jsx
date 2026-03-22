import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Database, X, Download, Upload } from 'lucide-react';

export default function BackupModal() {
    const { 
        modalAbierto, setModalAbierto, 
        equipos, ventas, catalogo, clientes, usuarios, config, caja, cortes,
        setEquipos, setVentas, setCatalogo, setClientes, setUsuarios, setConfig, setCaja, setCortes,
        addToast 
    } = useSystem();
    const [preview, setPreview] = React.useState(null);

    if (modalAbierto !== 'backup') return null;

    const handleExport = () => {
        const data = {
            equipos, ventas, catalogo, clientes, usuarios, config, caja, cortes
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fastpv_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addToast("✅ Respaldo descargado correctamente. Guarde este archivo en un lugar seguro.", 'success');
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target.result;
                const raw = JSON.parse(content);
                const data = raw.data || raw; 

                console.log("Datos de respaldo detectados:", data);

                const imported = {
                    equipos: data.equipos || data['sys-equipos'] || data.stations || data.devices,
                    catalogo: data.catalogo || data['sys-catalogo'] || data.productos || data.inventory || data.items || data.stock,
                    clientes: data.clientes || data['sys-clientes'] || data.clients || data.customers,
                    ventas: data.ventas || data['sys-ventas'] || data.sales || data.history || data.tickets || [],
                    usuarios: data.usuarios || data['sys-usuarios'] || data.users || null,
                    config: data.config || data['sys-config'] || data.settings || null,
                    caja: data.caja || data['sys-caja'] || data.terminal || data.session || null,
                    cortes: data.cortes || data['sys-cortes'] || data.shifts || data.reports || []
                };

                if (Array.isArray(raw) && !imported.catalogo) {
                    if (raw.length > 0 && (raw[0].nombre || raw[0].codigo)) imported.catalogo = raw;
                }

                console.log("IMPORTADO PREPARADO:", imported);

                if (imported.catalogo || imported.equipos) {
                    setPreview(imported);
                } else {
                    alert("❌ El archivo no contiene datos válidos.");
                }
            } catch (err) {
                alert("❌ Error: " + err.message);
            }
        };
        reader.readAsText(file);
    };

    const confirmImport = () => {
        if(!preview) return;
        
        if(preview.equipos) setEquipos(preview.equipos);
        if(preview.catalogo) setCatalogo(preview.catalogo);
        if(preview.clientes) setClientes(preview.clientes);
        if(preview.ventas) setVentas(preview.ventas);
        if(preview.usuarios) setUsuarios(preview.usuarios);
        if(preview.config) setConfig(preview.config);
        if(preview.caja) setCaja(preview.caja);
        if(preview.cortes) setCortes(preview.cortes);
        
        addToast(`✅ Datos restaurados. Reiniciando...`, 'success');
        setTimeout(() => window.location.reload(), 800);
    };

    return (
        <div className="fixed inset-0 bg-slate-500/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-anim">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden modal-anim border border-white/20 dark:border-slate-700">
                <div className="bg-amber-500 p-4 text-white flex justify-between items-center">
                    <h2 className="font-bold flex gap-2 items-center"><Database/> Respaldo y Migración</h2>
                    <button onClick={() => setModalAbierto(null)} className="p-1 rounded-full hover:bg-amber-600 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-6 bg-white dark:bg-slate-900">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
                        <h3 className="font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2"><Download size={20}/> Exportar Datos</h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300/80 mb-4">Descarga un archivo con toda la información actual para guardarlo o llevarlo a otra PC.</p>
                        <button onClick={handleExport} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-bold shadow transition-all">Descargar Respaldo (.json)</button>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2"><Upload size={20}/> Importar Datos</h3>
                        
                        {preview ? (
                            <div className="mt-2 p-4 bg-amber-50 dark:bg-amber-900/40 rounded-xl border-2 border-amber-200 dark:border-amber-800 animate-pulse-slow">
                                <h4 className="text-amber-800 dark:text-amber-400 font-bold flex items-center gap-2 mb-2 italic">
                                    📂 Respaldo Detectado
                                </h4>
                                <ul className="text-xs text-amber-700 dark:text-amber-300 mb-4 grid grid-cols-2 gap-1">
                                    <li>• {preview.catalogo?.length || 0} productos</li>
                                    <li>• {preview.equipos?.length || 0} estaciones</li>
                                    <li>• {preview.clientes?.length || 0} clientes</li>
                                    <li>• {preview.ventas?.length || 0} ventas</li>
                                </ul>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={confirmImport}
                                        className="flex-1 py-3 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 shadow-lg active:scale-95 transition-all text-sm"
                                    >
                                        CONFIRMAR Y CARGAR
                                    </button>
                                    <button 
                                        onClick={() => setPreview(null)}
                                        className="px-4 py-3 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg font-medium border border-slate-200 dark:border-slate-600 text-sm"
                                    >
                                        X
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Carga un archivo de respaldo. <span className="font-bold text-rose-600">Esto sobrescribirá los datos actuales.</span></p>
                                <input 
                                    type="file" 
                                    accept=".json" 
                                    onClick={(e) => e.target.value = null}
                                    onChange={handleImport} 
                                    className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-300 transition-all cursor-pointer"
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}