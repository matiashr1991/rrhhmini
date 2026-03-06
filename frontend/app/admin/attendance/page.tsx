'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { Search, RotateCcw, Monitor, User, Calendar, Clock, AlertCircle, Plus, X, Check } from 'lucide-react';

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
        id: string;
        firstName: string;
        lastName: string;
        employeeKey: string;
    };
}

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    employeeKey: string;
    dni: string;
}

export default function AttendancePage() {
    const [activeTab, setActiveTab] = useState<'daily' | 'logs'>('daily');

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

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Manual entry modal
    const [showModal, setShowModal] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [empSearch, setEmpSearch] = useState('');
    const [manualDate, setManualDate] = useState('');
    const [manualTime, setManualTime] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Admin check
    const [isAdmin, setIsAdmin] = useState(false);
    useEffect(() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            setIsAdmin(u?.role === 'ADMIN');
        } catch { setIsAdmin(false); }
    }, []);

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
            const query = date ? `?date=${date}` : '';
            const res = await api.get(`/attendance/logs${query}`);
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

    // Filtered daily by search
    const filteredDaily = useMemo(() => {
        if (!searchQuery.trim()) return daily;
        const q = searchQuery.toLowerCase();
        return daily.filter(row =>
            row.employee.firstName.toLowerCase().includes(q) ||
            row.employee.lastName.toLowerCase().includes(q) ||
            row.employee.employeeKey.toLowerCase().includes(q) ||
            `${row.employee.lastName}, ${row.employee.firstName}`.toLowerCase().includes(q)
        );
    }, [daily, searchQuery]);

    // Filtered logs by search
    const filteredEvents = useMemo(() => {
        if (!searchQuery.trim()) return events;
        const q = searchQuery.toLowerCase();
        return events.filter(ev => {
            if (!ev.employee) return false;
            return (
                ev.employee.firstName.toLowerCase().includes(q) ||
                ev.employee.lastName.toLowerCase().includes(q) ||
                ev.employee.employeeKey.toLowerCase().includes(q)
            );
        });
    }, [events, searchQuery]);

    // Modal logic
    const openModal = async () => {
        setShowModal(true);
        setSelectedEmployee(null);
        setEmpSearch('');
        setManualDate(date);
        setManualTime('08:00');
        setSaveSuccess(false);
        if (employees.length === 0) {
            try {
                const res = await api.get('/employees');
                setEmployees(res.data.filter((e: Employee) => e.firstName && e.lastName));
            } catch (err) {
                console.error('Error fetching employees:', err);
            }
        }
    };

    const filteredEmployeesForModal = useMemo(() => {
        if (!empSearch.trim()) return employees.slice(0, 20);
        const q = empSearch.toLowerCase();
        return employees.filter(e =>
            e.firstName?.toLowerCase().includes(q) ||
            e.lastName?.toLowerCase().includes(q) ||
            e.employeeKey?.toLowerCase().includes(q) ||
            e.dni?.includes(q)
        ).slice(0, 20);
    }, [employees, empSearch]);

    const handleSaveManual = async () => {
        if (!selectedEmployee || !manualDate || !manualTime) return;
        setSaving(true);
        try {
            // Build UTC timestamp from local date + time
            const localDateTime = new Date(`${manualDate}T${manualTime}:00`);
            const timestamp = localDateTime.toISOString();

            await api.post('/attendance/manual', {
                employeeId: selectedEmployee.id,
                timestamp,
            });
            setSaveSuccess(true);
            setTimeout(() => {
                setShowModal(false);
                setSaveSuccess(false);
                // Refresh data
                if (activeTab === 'daily') fetchDaily();
                else fetchLogs();
            }, 1200);
        } catch (err: any) {
            console.error('Error saving manual event:', err);
            setError(err.response?.data?.message || 'Error al guardar la fichada manual');
        } finally {
            setSaving(false);
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
                    {isAdmin && (
                        <button
                            onClick={openModal}
                            className="flex items-center gap-2 px-4 py-2 bg-eco-700 hover:bg-eco-800 text-white font-medium rounded-lg transition shadow-sm text-sm"
                        >
                            <Plus size={16} />
                            Cargar Fichada
                        </button>
                    )}
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

            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
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
                    <button onClick={activeTab === 'daily' ? fetchDaily : fetchLogs} className="p-2 text-eco-700 hover:bg-eco-50 rounded-lg">
                        <RotateCcw size={18} />
                    </button>
                </div>

                {/* Search bar */}
                <div className="relative flex-1 max-w-md">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido o legajo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-eco-600 focus:border-eco-600 outline-none shadow-sm transition"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

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
                                ) : filteredEvents.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">{searchQuery ? 'No se encontraron resultados.' : 'No hay registros recientes.'}</td></tr>
                                ) : filteredEvents.map((ev) => (
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
                                ) : filteredDaily.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">{searchQuery ? 'No se encontraron resultados.' : 'No hay registros procesados para este día.'}</td></tr>
                                ) : filteredDaily.map((row) => (
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
                                            ) : row.status === 'HOLIDAY' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Feriado
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

            {/* Manual Entry Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Plus size={20} className="text-eco-700" />
                                Cargar Fichada Manual
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            {saveSuccess ? (
                                <div className="flex flex-col items-center gap-3 py-8">
                                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                                        <Check size={28} className="text-green-600" />
                                    </div>
                                    <p className="text-green-700 font-semibold text-lg">Fichada registrada</p>
                                </div>
                            ) : (
                                <>
                                    {/* Employee search */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Empleado</label>
                                        {selectedEmployee ? (
                                            <div className="flex items-center justify-between bg-eco-50 border border-eco-200 rounded-xl p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-eco-200 flex items-center justify-center text-eco-800 font-bold text-xs">
                                                        {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 text-sm">{selectedEmployee.lastName}, {selectedEmployee.firstName}</div>
                                                        <div className="text-xs text-gray-500">Legajo: {selectedEmployee.employeeKey}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => { setSelectedEmployee(null); setEmpSearch(''); }}
                                                    className="p-1 hover:bg-eco-100 rounded-lg transition"
                                                >
                                                    <X size={16} className="text-gray-500" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="relative">
                                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar empleado por nombre, legajo o DNI..."
                                                        value={empSearch}
                                                        onChange={(e) => setEmpSearch(e.target.value)}
                                                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-eco-600 outline-none"
                                                        autoFocus
                                                    />
                                                </div>
                                                {empSearch.length > 0 && (
                                                    <div className="mt-2 border border-gray-200 rounded-xl max-h-48 overflow-y-auto shadow-sm">
                                                        {filteredEmployeesForModal.length === 0 ? (
                                                            <div className="p-3 text-sm text-gray-500 text-center">Sin resultados</div>
                                                        ) : filteredEmployeesForModal.map(emp => (
                                                            <button
                                                                key={emp.id}
                                                                onClick={() => { setSelectedEmployee(emp); setEmpSearch(''); }}
                                                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left border-b border-gray-50 last:border-b-0"
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                                                                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">{emp.lastName}, {emp.firstName}</div>
                                                                    <div className="text-xs text-gray-500">Legajo: {emp.employeeKey} {emp.dni ? `· DNI: ${emp.dni}` : ''}</div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Date and Time */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                                            <input
                                                type="date"
                                                value={manualDate}
                                                onChange={(e) => setManualDate(e.target.value)}
                                                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-eco-600 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                                            <input
                                                type="time"
                                                value={manualTime}
                                                onChange={(e) => setManualTime(e.target.value)}
                                                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-eco-600 outline-none"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        {!saveSuccess && (
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveManual}
                                    disabled={!selectedEmployee || !manualDate || !manualTime || saving}
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-eco-700 rounded-xl hover:bg-eco-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            Guardar Fichada
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
