'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';

const CURRENT_VERSION = 'v1.1.0'; // Cambiar esto para forzar que aparezca de nuevo el modal

const CHANGELOG = [
    {
        version: 'v1.1.0',
        date: '21 de Abril, 2026',
        features: [
            '¡Portal Personalizado! Ahora el sistema te recibe por tu nombre.',
            'Nueva sección "Mis Asistencias": Consultá tus fichadas de forma autónoma.',
            'Mejoras en la recuperación de contraseñas y blanqueo por administrador.',
            'Se han corregido errores menores y optimizado la carga del dashboard.'
        ],
    },
    {
        version: 'v1.0.1',
        date: '20 de Abril, 2026',
        features: [
            'Se agregó esta misma bitácora de novedades para mantenerte informado.',
            'Mejoras en el rendimiento del inicio de sesión.',
            'Corrección de errores menores en la visualización de licencias.'
        ],
    }
];

export default function ChangelogModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Chequeamos si el usuario ya vio esta versión
        const seenVersion = localStorage.getItem('seen_changelog_version');
        
        if (seenVersion !== CURRENT_VERSION) {
            // Un pequeño delay para que la animación de carga se termine y no choque visualmente
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('seen_changelog_version', CURRENT_VERSION);
        setIsOpen(false);
    };

    if (!isOpen) return null;

    const latestUpdate = CHANGELOG[0];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                
                {/* Header (Banner) */}
                <div className="bg-gradient-to-r from-eco-600 to-eco-500 p-6 text-white relative">
                    <button 
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Sparkles size={24} className="text-eco-100" />
                        </div>
                        <h2 className="text-xl font-bold">¡Tenemos Novedades!</h2>
                    </div>
                    <p className="text-eco-100 text-sm">
                        Hemos actualizado el sistema para mejorar tu experiencia.
                    </p>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="mb-4">
                        <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-gray-100">
                            <span className="font-bold text-gray-800 text-lg">
                                Versión {latestUpdate.version}
                            </span>
                            <span className="text-sm font-medium text-gray-500">
                                {latestUpdate.date}
                            </span>
                        </div>
                        
                        <ul className="space-y-3">
                            {latestUpdate.features.map((feature, idx) => (
                                <li key={idx} className="flex gap-3 text-gray-600 text-sm leading-relaxed">
                                    <CheckCircle2 size={18} className="text-eco-500 shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={handleClose}
                        className="px-6 py-2.5 bg-eco-600 text-white font-medium text-sm rounded-xl hover:bg-eco-700 transition shadow-sm"
                    >
                        Entendido, continuar
                    </button>
                </div>
            </div>
        </div>
    );
}
