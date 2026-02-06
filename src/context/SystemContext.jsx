import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { playSound } from '../utils/sound';
import { USUARIOS_DEFAULT, EQUIPOS_INICIALES, PRODUCTOS_BASE_DEFAULT, CLIENTES_INICIALES, CONFIG_INICIAL } from '../constants/initialData';

const SystemContext = createContext();

export const useSystem = () => useContext(SystemContext);

export const SystemProvider = ({ children }) => {
    // --- STATES (Migrados de CiberManager) ---
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [usuarios, setUsuarios] = useState(() => JSON.parse(localStorage.getItem('sys-usuarios')) || USUARIOS_DEFAULT);
    const [equipos, setEquipos] = useState(() => {
        const s = localStorage.getItem('sys-equipos');
        return s ? JSON.parse(s) : EQUIPOS_INICIALES.map(e => ({ ...e, inicio: null, tiempoAcumulado: 0, cuenta: [], modo: 'libre', limiteTiempo: 0, alertaMinuto: false }));
    });
    const [catalogo, setCatalogo] = useState(() => JSON.parse(localStorage.getItem('sys-catalogo')) || PRODUCTOS_BASE_DEFAULT);
    const [ventas, setVentas] = useState(() => JSON.parse(localStorage.getItem('sys-ventas')) || []);
    const [clientes, setClientes] = useState(() => JSON.parse(localStorage.getItem('sys-clientes')) || CLIENTES_INICIALES);
    const [config, setConfig] = useState(() => JSON.parse(localStorage.getItem('sys-config')) || CONFIG_INICIAL);
    const [caja, setCaja] = useState(() => JSON.parse(localStorage.getItem('sys-caja')) || { activa: false, fondo: 0, inicio: null });
    const [cortes, setCortes] = useState(() => JSON.parse(localStorage.getItem('sys-cortes')) || []);
    
    // UI States
    const [modalAbierto, setModalAbierto] = useState(null);
    const [equipoSeleccionadoId, setEquipoSeleccionadoId] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [modoEdicion, setModoEdicion] = useState(false);
    
    // --- DARK MODE ---
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('sys-theme');
        return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        localStorage.setItem('sys-theme', JSON.stringify(darkMode));
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(prev => !prev);

    // --- PERSISTENCIA ---
    useEffect(() => {
        localStorage.setItem('sys-equipos', JSON.stringify(equipos));
        localStorage.setItem('sys-ventas', JSON.stringify(ventas));
        localStorage.setItem('sys-catalogo', JSON.stringify(catalogo));
        localStorage.setItem('sys-clientes', JSON.stringify(clientes));
        localStorage.setItem('sys-usuarios', JSON.stringify(usuarios));
        localStorage.setItem('sys-config', JSON.stringify(config));
        localStorage.setItem('sys-caja', JSON.stringify(caja));
        localStorage.setItem('sys-cortes', JSON.stringify(cortes));
    }, [equipos, ventas, catalogo, clientes, usuarios, config, caja, cortes]);

    // --- TOAST SYSTEM ---
    const addToast = useCallback((msg, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    // --- NOTIFICACIONES PUSH ---
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // --- TIMER LOOP (Lógica central de tiempo) ---
    useEffect(() => {
        const interval = setInterval(() => {
            setEquipos(prev => prev.map(eq => {
                if (eq.estado === 'ocupado' && eq.inicio) {
                    const tiempoTranscurrido = eq.tiempoAcumulado + (Date.now() - eq.inicio);
                    let newState = { ...eq, _tick: Date.now() };

                    if (eq.modo === 'prepago' && eq.limiteTiempo > 0) {
                        const restante = eq.limiteTiempo - tiempoTranscurrido;
                        if (restante <= 60000 && restante > 0 && !eq.alertaMinuto) {
                            playSound('warning');
                            newState.alertaMinuto = true;
                        }
                        if (restante <= 0) {
                            playSound('alarm');
                            
                            if ("Notification" in window && Notification.permission === "granted") {
                                new Notification("¡Tiempo Terminado!", {
                                    body: `El tiempo de ${eq.nombre} ha finalizado.`,
                                    icon: '/icon-192.png',
                                    requireInteraction: true
                                });
                            }

                            newState.estado = 'finalizado'; 
                            newState.inicio = null;
                            newState.tiempoAcumulado = eq.limiteTiempo;
                            newState.alertaMinuto = false;
                        }
                    }
                    return newState;
                }
                return eq;
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // --- REORDENAMIENTO DE EQUIPOS ---
    const reordenarEquipos = (origenIndex, destinoIndex) => {
        const nuevosEquipos = [...equipos];
        const [itemMovido] = nuevosEquipos.splice(origenIndex, 1);
        nuevosEquipos.splice(destinoIndex, 0, itemMovido);
        setEquipos(nuevosEquipos);
    };

    // Aquí irían el resto de funciones (abrirCaja, cobrar, etc.) expuestas en el value
    // Para brevedad, expongo lo básico, pero deberías mover todas las funciones helper aquí.

    const value = {
        usuarioActual, setUsuarioActual,
        usuarios, setUsuarios,
        equipos, setEquipos,
        catalogo, setCatalogo,
        ventas, setVentas,
        clientes, setClientes,
        config, setConfig,
        caja, setCaja,
        cortes, setCortes,
        modalAbierto, setModalAbierto,
        equipoSeleccionadoId, setEquipoSeleccionadoId,
        toasts, addToast, removeToast,
        darkMode, toggleDarkMode,
        modoEdicion, setModoEdicion,
        reordenarEquipos,
        // Helpers
        playSound
    };

    return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
};
