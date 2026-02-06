import React, { useState } from 'react';
import { useSystem } from '../context/SystemContext';
import { Lock, ArrowRightLeft } from 'lucide-react';

export default function LoginScreen() {
    const { setUsuarioActual, usuarios, config } = useSystem();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const empresa = config.negocio?.nombre || "FasTPV";

    const handleNum = (num) => { 
        if (pin.length < 4) setPin(prev => prev + num); 
        setError(false); 
    };
    
    const handleClear = () => { setPin(''); setError(false); };
    
    const handleSubmit = () => {
        const user = usuarios.find(u => u.pin === pin);
        if (user) {
            setUsuarioActual(user);
        } else { 
            setError(true); 
            setPin(''); 
            setTimeout(() => setError(false), 1000); 
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit();
    };

    return (
        <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-[100] overflow-hidden">
            <div className="absolute inset-0 bg-slate-200 backdrop-blur-3xl"></div>
            <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl w-full max-w-sm modal-anim border border-white/60 relative z-10 transition-colors">
                <div className="text-center mb-6">
                    <div className="bg-white/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner transition-colors">
                        <Lock className="text-slate-700" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">{empresa}</h2>
                    <p className="text-slate-400 text-sm">Sistema de Control</p>
                </div>
                
                <div className="mb-6">
                    <input 
                        type="password" 
                        value={pin} 
                        onChange={(e) => { if(e.target.value.length <= 4 && /^\d*$/.test(e.target.value)) { setPin(e.target.value); setError(false); } }}
                        onKeyDown={handleKeyDown}
                        className={`w-full text-center text-3xl tracking-[1em] border-b border-slate-300 py-2 focus:outline-none focus:border-blue-500 bg-transparent transition-all ${error ? 'border-rose-500 text-rose-500' : 'text-slate-800'}`}
                        placeholder="••••"
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (<button key={n} onClick={() => handleNum(n)} className="h-14 rounded-2xl bg-white/50 hover:bg-white border border-white/50 shadow-sm active:scale-95 font-medium text-xl text-slate-700 transition-all">{n}</button>))}
                    <button onClick={handleClear} className="h-14 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 border border-rose-100 active:scale-95 transition-all">C</button>
                    <button onClick={() => handleNum(0)} className="h-14 rounded-2xl bg-white/50 hover:bg-white border border-white/50 shadow-sm active:scale-95 font-medium text-xl text-slate-700 transition-all">{0}</button>
                    <button onClick={handleSubmit} className="h-14 rounded-2xl bg-blue-500 text-white font-bold hover:bg-blue-600 shadow-lg shadow-blue-500/30 active:scale-95 flex justify-center items-center transition-all"><ArrowRightLeft size={20} /></button>
                </div>
                {error && <p className="text-center text-rose-500 text-sm font-bold animate-pulse">PIN Incorrecto</p>}
            </div>
        </div>
    );
}