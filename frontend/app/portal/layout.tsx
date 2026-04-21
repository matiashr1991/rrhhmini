'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, User, Menu, X, Clock, CalendarCheck } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import EcologiaLogo from '@/components/EcologiaLogo';
import MaintenanceGuard from '@/components/MaintenanceGuard';
import ChangelogModal from '@/components/ChangelogModal';

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

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

    if (!authChecked) {
        return (
            <div className="min-h-screen bg-eco-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-eco-200 border-t-eco-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-eco-50 flex">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0 md:static md:block`}
                style={{
                    background: 'linear-gradient(180deg, #2C4A38 0%, #3E6C51 100%)',
                }}
            >
                <div className="h-full flex flex-col">
                    <div className="h-16 flex items-center px-5 border-b border-white/10 justify-between">
                        <div className="flex items-center gap-3">
                            <EcologiaLogo size={32} />
                            <div className="leading-none">
                                <span className="text-sm font-bold text-white tracking-wide block">Portal</span>
                                <span className="text-[10px] font-medium text-eco-300 tracking-widest block">EMPLEADO</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="hidden md:block"><NotificationBell target="employee" /></span>
                            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-eco-300 hover:text-white transition">
                                <X size={22} />
                            </button>
                        </div>
                    </div>
                    <nav className="flex-1 p-3 space-y-0.5">
                        <Link
                            href="/portal/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-eco-200 rounded-xl hover:bg-white/8 hover:text-white transition"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <User size={19} />
                            Mi Perfil
                        </Link>
                        <Link
                            href="/portal/leaves"
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition ${
                                pathname === '/portal/leaves' ? 'text-white bg-white/15 shadow-sm shadow-black/10' : 'text-eco-200 hover:bg-white/8 hover:text-white'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <Clock size={19} />
                            Mis Licencias
                        </Link>
                        <Link
                            href="/portal/attendance"
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition ${
                                pathname === '/portal/attendance' ? 'text-white bg-white/15 shadow-sm shadow-black/10' : 'text-eco-200 hover:bg-white/8 hover:text-white'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <CalendarCheck size={19} />
                            Mis Asistencias
                        </Link>
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

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-eco-100 h-14 flex items-center px-4 justify-between sticky top-0 z-30 shadow-sm shadow-eco-900/5">
                    <button className="p-2 text-eco-600" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <div className="flex items-center gap-2">
                        <EcologiaLogo size={24} />
                        <span className="font-bold text-sm text-eco-700">Portal</span>
                    </div>
                    <NotificationBell target="employee" />
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <MaintenanceGuard>{children}</MaintenanceGuard>
                </main>
            </div>

            <ChangelogModal />
        </div>
    );
}
