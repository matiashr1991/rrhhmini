'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Wrench } from 'lucide-react';

interface MaintenanceGuardProps {
    children: React.ReactNode;
}

/**
 * Wraps page content and shows a maintenance page for non-admin users
 * when the system is in maintenance mode.
 * Admin users bypass the guard so they can work on the system.
 */
export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
    const [isInMaintenance, setIsInMaintenance] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState('');
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const res = await api.get('/maintenance/status');
                if (res.data?.enabled) {
                    // Check if current user is admin — admins bypass maintenance
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        if (user.role === 'admin') {
                            setIsInMaintenance(false);
                            setChecked(true);
                            return;
                        }
                    }
                    setIsInMaintenance(true);
                    setMaintenanceMessage(res.data.message || 'Sistema en mantenimiento.');
                } else {
                    setIsInMaintenance(false);
                }
            } catch {
                // If we can't reach the backend, don't block — just proceed
                setIsInMaintenance(false);
            } finally {
                setChecked(true);
            }
        };

        checkMaintenance();

        // Re-check every 30 seconds
        const interval = setInterval(checkMaintenance, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!checked) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (isInMaintenance) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                        <Wrench size={48} className="text-amber-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Sistema en Mantenimiento</h1>
                    <p className="text-slate-300 text-lg mb-8 leading-relaxed">{maintenanceMessage}</p>
                    <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
                        <p className="text-slate-400 text-sm">
                            Estamos trabajando para mejorar el sistema. 
                            Por favor, volvé a intentar en unos minutos.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
