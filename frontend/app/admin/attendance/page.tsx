'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Search, RotateCcw, Monitor, User, Calendar, Clock, AlertCircle } from 'lucide-react';

interface AttendanceEvent {
    id: string;
    timestamp: string;
    deviceId: string;
    serialNo: number;
    employee?: {
        firstName: string;
        lastName: string;
        employeeKey: string;
    };
    rawData: any;
}

interface DailyAttendance {
    id: string;
    date: string;
    inTime: string;
    outTime: string;
    hoursWorked: number;
    isLate: boolean;
    isAbsent: boolean;
    status: string;
    meta?: any;
    employee: {
        firstName: string;
        lastName: string;
        employeeKey: string;
    };
}

export default function AttendancePage() {
    const [activeTab, setActiveTab] = useState<'daily' | 'logs'>('daily');

    // Use local date to avoid UTC offset issues (toISOString() uses UTC which
    // can give yesterday's date for users in negative-offset timezones like UTC-3)
    const getLocalDateStr = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    const [date, setDate] = useState(getLocalDateStr());


    const [events, setEvents] = useState<AttendanceEvent[]>([]);
    const [daily, setDaily] = useState<DailyAttendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (activeTab === 'daily') fetchDaily();
        else fetchLogs();
    }, [date, activeTab]);

    const fetchDaily = async () => {
        setLoading(true);
        setError('');
        try {
            const query = date ? `?date=${date}` : '';
            const response = await api.get(`/attendance/daily${query}`);
            setDaily(response.data);
        } catch (error: any) {
            console.error('Error fetching daily attendance:', error);
            setError('Error al cargar datos. Intente recargar o iniciar sesión nuevamente.');
            if (error.response?.status === 401) {
                setError('Sesión expirada. Por favor ingrese nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/attendance/logs');
            setEvents(res.data);
        } catch (error: any) {
            console.error('Error fetching attendance logs:', error);
            setError('Error al cargar datos. Intente recargar o iniciar sesión nuevamente.');
            if (error.response?.status === 401) {
                setError('Sesión expirada. Por favor ingrese nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Monitor de Asistencia</h1>
                    <p className="text-gray-500 mt-1">Control de presencia y registro de fichadas.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('daily')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === 'daily' ? 'bg-white text-eco-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Parte Diario
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === 'logs' ? 'bg-white text-eco-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Log Fichadas
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'daily' && (
                <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm w-fit">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Calendar size={16} />
                        Fecha:
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-sm text-gray-900 focus:ring-2 focus:ring-eco-600 outline-none"
                    />
                    <button onClick={fetchDaily} className="p-2 text-eco-700 hover:bg-eco-50 rounded-lg">
                        <RotateCcw size={18} />
                    </button>
                </div>
            )}


            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {activeTab === 'logs' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 font-semibold text-sm uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 pl-6">Hora</th>
                                    <th className="p-4">Empleado</th>
                                    <th className="p-4">Dispositivo</th>
                                    <th className="p-4">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">Cargando eventos...</td></tr>
                                ) : events.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">No hay registros recientes.</td></tr>
                                ) : events.map((ev) => (
                                    <tr key={ev.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 pl-6 font-medium text-gray-900">
                                            {new Date(ev.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            {ev.employee ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-eco-100 flex items-center justify-center text-eco-700 font-bold text-xs">
                                                        {ev.employee.firstName[0]}{ev.employee.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{ev.employee.lastName}, {ev.employee.firstName}</div>
                                                        <div className="text-xs text-gray-500">Legajo: {ev.employee.employeeKey}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic flex items-center gap-2">
                                                    <User size={16} /> Desconocido
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-500 flex items-center gap-2">
                                            <Monitor size={16} />
                                            {ev.deviceId || 'N/A'}
                                        </td>
                                        <td className="p-4 text-xs text-gray-400 font-mono">
                                            {ev.serialNo ? `S:${ev.serialNo}` : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 font-semibold text-sm uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 pl-6">Empleado</th>
                                    <th className="p-4">Entrada</th>
                                    <th className="p-4">Salida</th>
                                    <th className="p-4">Horas</th>
                                    <th className="p-4">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Procesando asistencia...</td></tr>
                                ) : daily.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay registros procesados para este día.</td></tr>
                                ) : daily.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${row.status === 'ABSENT' ? 'bg-red-100 text-red-600' : row.status === 'LICENSE' ? 'bg-eco-100 text-eco-700' : 'bg-green-100 text-green-600'}`}>
                                                    {row.employee.firstName[0]}{row.employee.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{row.employee.lastName}, {row.employee.firstName}</div>
                                                    <div className="text-xs text-gray-500">Legajo: {row.employee.employeeKey}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {row.inTime ? (
                                                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-2 py-1 rounded w-fit text-xs font-medium border border-green-100">
                                                    <Clock size={12} />
                                                    {new Date(row.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4">
                                            {row.outTime ? (
                                                <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-2 py-1 rounded w-fit text-xs font-medium border border-gray-100">
                                                    <Clock size={12} />
                                                    {new Date(row.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 font-bold text-gray-900">
                                            {row.hoursWorked > 0 ? `${row.hoursWorked} hs` : '-'}
                                        </td>
                                        <td className="p-4">
                                            {row.status === 'LICENSE' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-eco-100 text-eco-900">
                                                    {row.meta?.leaveTypeName || 'Licencia'}
                                                </span>
                                            ) : row.status === 'OFF' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Franco
                                                </span>
                                            ) : row.status === 'ABSENT' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <AlertCircle size={12} /> Ausente
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Presente
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
