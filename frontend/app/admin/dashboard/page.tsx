'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Users, UserCheck, UserX, Briefcase, Inbox, Activity, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface DashboardStats {
    kpis: {
        totalEmployees: number;
        presentToday: number;
        absentToday: number;
        licenseToday: number;
        pendingRequests: number;
    };
    chartData: {
        date: string;
        presentes: number;
        ausentes: number;
        licencias: number;
    }[];
}

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    employeeKey: string;
    dni?: string;
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, empRes] = await Promise.all([
                    api.get('/reports/dashboard-stats'),
                    api.get('/employees')
                ]);
                setStats(statsRes.data);
                setEmployees(empRes.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
                    <p className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-gray-600">{entry.name}:</span>
                            <span className="font-semibold text-gray-900">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="p-8 h-full flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-700"></div>
                <p className="text-gray-500 font-medium animate-pulse">Cargando métricas del panel...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
                    <p className="text-gray-500 mt-1">Resumen general de recursos humanos y asistencia.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm">
                    <Activity size={16} className="text-eco-700" />
                    <span>Actualizado: {new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            {/* KPIs Row */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Total Empleados */}
                    <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between group hover:-translate-y-1 transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-eco-50 text-eco-700 rounded-xl group-hover:scale-110 transition-transform">
                                <Users size={24} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stats.kpis.totalEmployees}</h3>
                            <p className="text-sm text-gray-500 font-medium">Total Empleados</p>
                        </div>
                    </div>

                    {/* Presentes */}
                    <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between group hover:-translate-y-1 transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                                <UserCheck size={24} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stats.kpis.presentToday}</h3>
                            <p className="text-sm text-gray-500 font-medium">Presentes Hoy</p>
                        </div>
                    </div>

                    {/* Ausentes */}
                    <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between group hover:-translate-y-1 transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                                <UserX size={24} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stats.kpis.absentToday}</h3>
                            <p className="text-sm text-gray-500 font-medium">Ausentes Hoy</p>
                        </div>
                    </div>

                    {/* Licencias */}
                    <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between group hover:-translate-y-1 transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-lapacho-50 text-lapacho-500 rounded-xl group-hover:scale-110 transition-transform">
                                <Briefcase size={24} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stats.kpis.licenseToday}</h3>
                            <p className="text-sm text-gray-500 font-medium">De Licencia Hoy</p>
                        </div>
                    </div>

                    {/* Solicitudes Pendientes */}
                    <Link href="/admin/leave-requests" className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(245,158,11,0.1)] border border-amber-100 flex flex-col justify-between group hover:-translate-y-1 transition-transform block">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/60 text-amber-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                <Inbox size={24} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-amber-900 tracking-tight">{stats.kpis.pendingRequests}</h3>
                            <div className="flex items-center gap-1 text-sm text-amber-700 font-medium mt-1">
                                Solicitudes Pendientes <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                </div>
            )}

            {/* Charts Row */}
            {stats && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Activity className="text-eco-700" size={20} />
                        Tendencia de Asistencia (Últimos 7 días)
                    </h2>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                <Bar dataKey="presentes" name="Presentes" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar dataKey="ausentes" name="Ausentes" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar dataKey="licencias" name="Licencias" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Listado de Empleados Row */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users className="text-eco-700" size={20} />
                        Vista Rápida de Personal
                    </h2>
                    <Link href="/admin/employees" className="text-sm text-eco-700 hover:text-eco-900 font-medium flex items-center gap-1 group">
                        Ver todos <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">Legajo</th>
                                <th className="p-4">Nombre Completo</th>
                                <th className="p-4">DNI</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100">
                            {employees.slice(0, 5).map((emp) => ( // Show only top 5 for quick view
                                <tr key={emp.id} className="hover:bg-eco-50/50 transition">
                                    <td className="p-4 pl-6 font-medium text-gray-900">{emp.employeeKey}</td>
                                    <td className="p-4 text-gray-700 font-medium">{emp.lastName}, {emp.firstName}</td>
                                    <td className="p-4 text-gray-500">{emp.dni || '-'}</td>
                                </tr>
                            ))}
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500">
                                        No hay empleados registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
