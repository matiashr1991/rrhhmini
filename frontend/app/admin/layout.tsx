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
    Database
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import NotificationBell from '@/components/NotificationBell';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Users, label: 'Empleados', href: '/admin/employees' },
    { icon: Database, label: 'Paramétricas', href: '/admin/parametrics' },
    { icon: CalendarCheck, label: 'Asistencias', href: '/admin/attendance' },
    { icon: Coffee, label: 'Licencias', href: '/admin/leaves' },
    { icon: FileText, label: 'Reportes', href: '/admin/reports' },
    { icon: Settings, label: 'Configuración', href: '/admin/settings' },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:relative md:translate-x-0`}
            >
                <div className="h-full flex flex-col">
                    <div className="h-16 flex items-center px-6 border-b border-gray-100">
                        <span className="text-xl font-bold text-blue-600">Sistema<span className="text-gray-900">RRHH</span></span>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon size={20} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-gray-100">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition w-full"
                        >
                            <LogOut size={20} />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 justify-between sticky top-0 z-40">
                    <button
                        className="md:hidden p-2 text-gray-500"
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                    >
                        <Menu size={24} />
                    </button>
                    <div className="text-sm text-gray-500">Panel de Administración</div>
                    <div className="flex items-center gap-4">
                        <NotificationBell target="admin" />
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            AD
                        </div>
                        <button
                            onClick={handleLogout}
                            className="hidden md:flex p-2 text-gray-400 hover:text-red-600 transition"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={20} />
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
