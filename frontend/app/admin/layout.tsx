'use client';

import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    FileText,
    Settings,
    Menu,
    LogOut,
    Coffee,
    Database,
    Shield
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import NotificationBell from '@/components/NotificationBell';
import EcologiaLogo from '@/components/EcologiaLogo';
import api from '@/lib/api';
import { Wrench } from 'lucide-react';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Users, label: 'Empleados', href: '/admin/employees' },
    { icon: Database, label: 'Paramétricas', href: '/admin/parametrics' },
    { icon: CalendarCheck, label: 'Asistencias', href: '/admin/attendance' },
    { icon: Coffee, label: 'Licencias', href: '/admin/leaves' },
    { icon: FileText, label: 'Reportes', href: '/admin/reports' },
    { icon: Settings, label: 'Configuración', href: '/admin/settings' },
    { icon: Shield, label: 'Auditoría', href: '/admin/audit' },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);

    // Initial check for maintenance mode
    useEffect(() => {
        api.get('/maintenance/status')
            .then(res => setMaintenanceEnabled(res.data.enabled))
            .catch(err => console.error(err));
    }, []);

    // Guard: si no hay token → redirigir al login
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        } else {
            setAuthChecked(true);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const toggleMaintenance = async () => {
        const newState = !maintenanceEnabled;
        if (newState && !confirm('¿Estás seguro de activar el modo mantenimiento? Los empleados no podrán acceder al portal.')) return;
        
        try {
            await api.post('/maintenance/toggle', { enabled: newState });
            setMaintenanceEnabled(newState);
        } catch (error) {
            console.error(error);
            alert('Error al cambiar el estado de mantenimiento. Verificá tu conexión y permisos.');
        }
    };

    if (!authChecked) {
        return (
            <div className="min-h-screen bg-eco-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-eco-200 border-t-eco-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-eco-50 flex">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:relative md:translate-x-0`}
                style={{
                    background: 'linear-gradient(180deg, #2C4A38 0%, #3E6C51 100%)',
                }}
            >
                <div className="h-full flex flex-col">
                    {/* Logo area */}
                    <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
                        <EcologiaLogo size={36} />
                        <div className="leading-none">
                            <span className="text-sm font-bold text-white tracking-wide block">ECOLOGÍA</span>
                            <span className="text-[10px] font-medium text-eco-300 tracking-widest block">MISIONES · RRHH</span>
                        </div>
                    </div>

                    <nav className="flex-1 px-3 py-5 space-y-0.5">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 ${isActive
                                        ? 'bg-white/15 text-white shadow-sm shadow-black/10'
                                        : 'text-eco-200 hover:bg-white/8 hover:text-white'
                                        }`}
                                >
                                    <Icon size={19} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-3 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-lapacho-300 rounded-xl hover:bg-lapacho-500/15 hover:text-lapacho-200 transition w-full"
                        >
                            <LogOut size={19} />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-eco-100 h-14 flex items-center px-6 justify-between sticky top-0 z-40 shadow-sm shadow-eco-900/5">
                    <button
                        className="md:hidden p-2 text-eco-600 hover:text-eco-800 transition"
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                    >
                        <Menu size={22} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-eco-500 font-medium hidden sm:block">Panel de Administración</div>
                        <button
                            onClick={toggleMaintenance}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${maintenanceEnabled ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-transparent'}`}
                            title="Activar/Desactivar Mantenimiento"
                        >
                            <Wrench size={16} />
                            <span className="hidden sm:inline">{maintenanceEnabled ? 'Mantenimiento ACTIVO' : 'Mantenimiento OFF'}</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationBell target="admin" />
                        <div className="w-8 h-8 rounded-full bg-eco-100 flex items-center justify-center text-eco-700 font-bold text-xs border border-eco-200">
                            AD
                        </div>
                        <button
                            onClick={handleLogout}
                            className="hidden md:flex p-2 text-eco-400 hover:text-lapacho-500 transition"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
