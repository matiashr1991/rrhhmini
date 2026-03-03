'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User, Menu, X, Clock } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0 md:static md:block`}
            >
                <div className="h-full flex flex-col">
                    <div className="h-16 flex items-center px-6 border-b border-gray-100 justify-between">
                        <span className="text-xl font-bold text-blue-600 tracking-tight">Portal<span className="text-gray-900">Empleado</span></span>
                        <div className="flex items-center gap-4">
                            <span className="hidden md:block"><NotificationBell target="employee" /></span>
                            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400">
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                    <nav className="flex-1 p-4 space-y-1">
                        <Link
                            href="/portal/dashboard"
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition mb-1"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <User size={20} />
                            Mi Perfil
                        </Link>
                        <Link
                            href="/portal/leaves"
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl transition"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <Clock size={20} />
                            Mis Licencias
                        </Link>
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

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-200 h-16 flex items-center px-4 justify-between sticky top-0 z-30">
                    <button className="p-2 text-gray-600" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <span className="font-bold text-lg text-blue-600">Portal</span>
                    <NotificationBell target="employee" />
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
