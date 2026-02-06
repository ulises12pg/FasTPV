import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Database, X, Download, Upload } from 'lucide-react';

export default function BackupModal() {
    const { 
        modalAbierto, setModalAbierto, 
        equipos, ventas, catalogo, clientes, usuarios, config, caja, cortes,
        addToast 
    } = useSystem();

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
                const data = JSON.parse(event.target.result);
                if (Array.isArray(data.equipos) && Array.isArray(data.catalogo) && Array.isArray(data.clientes)) {
                    if(window.confirm("⚠️ ADVERTENCIA: Esto borrará los datos actuales y cargará el respaldo. ¿Continuar?")) {
                        localStorage.setItem('sys-equipos', JSON.stringify(data.equipos));
                        localStorage.setItem('sys-ventas', JSON.stringify(data.ventas || []));
                        localStorage.setItem('sys-catalogo', JSON.stringify(data.catalogo));
                        localStorage.setItem('sys-clientes', JSON.stringify(data.clientes));
                        if(data.usuarios) localStorage.setItem('sys-usuarios', JSON.stringify(data.usuarios));
                        if(data.config) localStorage.setItem('sys-config', JSON.stringify(data.config));
                        if(data.caja) localStorage.setItem('sys-caja', JSON.stringify(data.caja));
                        if(data.cortes) localStorage.setItem('sys-cortes', JSON.stringify(data.cortes));
                        
                        addToast("✅ Datos importados correctamente. El sistema se reiniciará para aplicar cambios.", 'success');
                        setTimeout(() => window.location.reload(), 2000);
                    }
                } else {
                    addToast("❌ Error: El archivo no tiene el formato válido.", 'error');
                }
            } catch (err) {
                addToast("❌ Error al leer el archivo: " + err, 'error');
            }
        };
        reader.readAsText(file);
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
                        <p className="text-sm text-amber-700 dark:text-amber-300/80 mb-4">Descarga un archivo con toda la información actual (Clientes, Ventas, Configuración) para guardarlo o llevarlo a otra PC.</p>
                        <button onClick={handleExport} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-bold shadow transition-all">Descargar Respaldo (.json)</button>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2"><Upload size={20}/> Importar Datos</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Carga un archivo de respaldo previamente descargado. <span className="font-bold text-rose-600 dark:text-rose-400">¡Cuidado! Esto sobrescribirá los datos actuales.</span></p>
                        <input type="file" accept=".json" onChange={handleImport} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-300 dark:hover:file:bg-indigo-900/50 transition-all cursor-pointer"/>
                    </div>
                </div>
            </div>
        </div>
    );
}