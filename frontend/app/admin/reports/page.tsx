'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Mail, Clock, Save, Send, AlertCircle, CheckCircle, Calendar, FileText, Download, Users, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DailyRecord {
    id: string;
    date: string;
    inTime: string | null;
    outTime: string | null;
    hoursWorked: number;
    status: string;
    isLate: boolean;
    isAbsent: boolean;
    employee: {
        id: string;
        employeeKey: string;
        firstName: string;
        lastName: string;
    };
    meta?: any;
}

interface MonthlyRecord {
    employee: {
        id: string;
        key: string;
        name: string;
    };
    stats: {
        present: number;
        absent: number;
        license: number;
        averageHours: string;
    };
    details?: any[];
}

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'config' | 'holidays'>('daily');

    // Holidays State
    const [holidays, setHolidays] = useState<any[]>([]);
    const [newHoliday, setNewHoliday] = useState({ date: '', description: '' });

    // Config State
    const [config, setConfig] = useState({
        recipients: '',
        scheduleTime: '18:00',
        isEnabled: false,
        dailyReportEnabled: true,
        monthlyReportEnabled: false
    });

    // Daily State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyData, setDailyData] = useState<DailyRecord[]>([]);

    // Monthly State
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [monthlyData, setMonthlyData] = useState<MonthlyRecord[]>([]);

    // Shared State
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (activeTab === 'config') fetchConfig();
        if (activeTab === 'daily') fetchDailyReport();
        if (activeTab === 'monthly') fetchMonthlyReport();
        if (activeTab === 'holidays') fetchHolidays();
    }, [activeTab, selectedDate, selectedMonth, selectedYear]);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reports/config');
            setConfig(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/daily?date=${selectedDate}`);
            setDailyData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthlyReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/monthly?month=${selectedMonth}&year=${selectedYear}`);
            setMonthlyData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const res = await api.get('/holidays');
            setHolidays(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/holidays', newHoliday);
            setMessage({ type: 'success', text: 'Feriado agregado correctamente.' });
            setNewHoliday({ date: '', description: '' });
            fetchHolidays();
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al agregar feriado.' });
        }
    };

    const handleDeleteHoliday = async (id: number) => {
        if (!confirm('¿Seguro quieres eliminar este feriado?')) return;
        try {
            await api.delete(`/holidays/${id}`);
            setMessage({ type: 'success', text: 'Feriado eliminado.' });
            fetchHolidays();
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al eliminar.' });
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/reports/config', config);
            setMessage({ type: 'success', text: 'Configuración guardada.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al guardar.' });
        }
    };

    const exportToExcel = (wb: XLSX.WorkBook, fileName: string) => {
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    };

    const handleExportDaily = () => {
        const exportData = dailyData.map(r => ({
            Legajo: r.employee.employeeKey,
            Nombre: `${r.employee.lastName}, ${r.employee.firstName}`,
            Fecha: r.date,
            Entrada: r.inTime ? new Date(r.inTime).toLocaleTimeString() : '-',
            Salida: r.outTime ? new Date(r.outTime).toLocaleTimeString() : '-',
            Horas: r.hoursWorked,
            Estado: getStatusLabel(r.status, r.isLate, r.meta?.leaveTypeName, r.meta?.holidayName),
            Detalle: r.status === 'HOLIDAY' ? (r.meta?.holidayName || '') : (r.meta?.leaveTypeName || '')
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Diario");
        exportToExcel(wb, `Reporte_Diario_${selectedDate}`);
    };

    const handleExportMonthly = () => {
        // Sheet 1: Summary
        const summaryData = monthlyData.map(r => ({
            Legajo: r.employee.key,
            Nombre: r.employee.name,
            Presentes: r.stats.present,
            Ausentes: r.stats.absent,
            Licencias: r.stats.license,
            PromedioHoras: r.stats.averageHours
        }));

        // Sheet 2: Details
        const detailData: any[] = [];
        monthlyData.forEach(r => {
            if (r.details) {
                r.details.forEach(d => {
                    detailData.push({
                        Legajo: r.employee.key,
                        Nombre: r.employee.name,
                        Fecha: d.date,
                        Entrada: d.inTime ? new Date(d.inTime).toLocaleTimeString() : '-',
                        Salida: d.outTime ? new Date(d.outTime).toLocaleTimeString() : '-',
                        Horas: d.hoursWorked,
                        Estado: getStatusLabel(d.status, d.isLate, d.leaveTypeName, d.holidayName),
                        Motivo: d.status === 'HOLIDAY' ? (d.holidayName || '') : (d.leaveTypeName || '')
                    });
                });
            }
        });

        // Sort details by Date then Name
        detailData.sort((a, b) => {
            if (a.Fecha !== b.Fecha) return a.Fecha.localeCompare(b.Fecha);
            return a.Nombre.localeCompare(b.Nombre);
        });

        const wb = XLSX.utils.book_new();
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen Mensual");

        const wsDetail = XLSX.utils.json_to_sheet(detailData);
        XLSX.utils.book_append_sheet(wb, wsDetail, "Detalle Diario");

        exportToExcel(wb, `Reporte_Mensual_${selectedMonth}_${selectedYear}`);
    };

    const getStatusLabel = (status: string, isLate: boolean, leaveName?: string, holidayName?: string) => {
        if (status === 'LICENSE') return leaveName ? leaveName : 'Licencia';
        if (status === 'HOLIDAY') return holidayName ? holidayName : 'Feriado';
        if (status === 'OFF') return 'Franco';
        if (status === 'PRESENT') return isLate ? 'Tarde' : 'Presente';
        return 'Ausente';
    };

    const getStatusColor = (status: string, isLate: boolean) => {
        if (status === 'LICENSE') return 'bg-eco-100 text-eco-900';
        if (status === 'HOLIDAY') return 'bg-purple-100 text-purple-800';
        if (status === 'OFF') return 'bg-gray-100 text-gray-800';
        if (status === 'PRESENT') return isLate ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
        return 'bg-red-100 text-red-800';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes</h1>
            <p className="text-gray-500 mb-8">Gestión de asistencia y reportes.</p>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('daily')}
                    className={`pb-4 px-4 font-medium transition whitespace-nowrap ${activeTab === 'daily' ? 'text-eco-700 border-b-2 border-eco-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Reporte Diario
                </button>
                <button
                    onClick={() => setActiveTab('monthly')}
                    className={`pb-4 px-4 font-medium transition whitespace-nowrap ${activeTab === 'monthly' ? 'text-eco-700 border-b-2 border-eco-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Reporte Mensual
                </button>
                <button
                    onClick={() => setActiveTab('config')}
                    className={`pb-4 px-4 font-medium transition whitespace-nowrap ${activeTab === 'config' ? 'text-eco-700 border-b-2 border-eco-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Configuración
                </button>
                <button
                    onClick={() => setActiveTab('holidays')}
                    className={`pb-4 px-4 font-medium transition whitespace-nowrap ${activeTab === 'holidays' ? 'text-eco-700 border-b-2 border-eco-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Feriados y No Laborables
                </button>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            {/* Content Active Tab */}
            {activeTab === 'daily' && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex items-center gap-4">
                            <label className="font-medium text-gray-700">Fecha:</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                            />
                        </div>
                        <button onClick={handleExportDaily} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                            <Download size={18} /> Exportar Excel
                        </button>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-gray-500 text-sm mb-1">Total Empleados</div>
                            <div className="text-2xl font-bold">{dailyData.length}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-green-600 text-sm mb-1">Presentes</div>
                            <div className="text-2xl font-bold">{dailyData.filter(d => d.status === 'PRESENT').length}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-red-600 text-sm mb-1">Ausentes</div>
                            <div className="text-2xl font-bold">{dailyData.filter(d => d.status === 'ABSENT').length}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-eco-700 text-sm mb-1">Licencias</div>
                            <div className="text-2xl font-bold">{dailyData.filter(d => d.status === 'LICENSE').length}</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">Legajo</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">Empleado</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">Entrada</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">Salida</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">Horas</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Cargando...</td></tr>
                                ) : dailyData.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay datos para esta fecha</td></tr>
                                ) : (
                                    dailyData.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 text-sm">
                                            <td className="p-4 font-medium text-gray-900">{row.employee.employeeKey}</td>
                                            <td className="p-4 text-gray-700">{row.employee.lastName}, {row.employee.firstName}</td>
                                            <td className="p-4 text-gray-600">{row.inTime ? new Date(row.inTime).toLocaleTimeString() : '-'}</td>
                                            <td className="p-4 text-gray-600">{row.outTime ? new Date(row.outTime).toLocaleTimeString() : '-'}</td>
                                            <td className="p-4 text-gray-600">{row.hoursWorked}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status, row.isLate)}`}>
                                                    {getStatusLabel(row.status, row.isLate, row.meta?.leaveTypeName)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'monthly' && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex items-center gap-4">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="border border-gray-300 rounded-lg px-4 py-2"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es-ES', { month: 'long' })}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="border border-gray-300 rounded-lg px-4 py-2 w-24 text-gray-900"
                            />
                        </div>
                        <button onClick={handleExportMonthly} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                            <Download size={18} /> Exportar Excel
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">Legajo</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">Empleado</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">Días Presente</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">Faltas</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">Licencias</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">Promedio Horas (Max 6)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Cargando...</td></tr>
                                ) : monthlyData.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay datos para este período</td></tr>
                                ) : (
                                    monthlyData.map((row) => (
                                        <tr key={row.employee.id} className="hover:bg-gray-50 text-sm">
                                            <td className="p-4 font-medium text-gray-900">{row.employee.key}</td>
                                            <td className="p-4 text-gray-700">{row.employee.name}</td>
                                            <td className="p-4 text-green-600 font-medium">{row.stats.present}</td>
                                            <td className="p-4 text-red-600 font-medium">{row.stats.absent}</td>
                                            <td className="p-4 text-eco-700 font-medium">{row.stats.license}</td>
                                            <td className="p-4 text-gray-900 font-bold">{row.stats.averageHours}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'config' && (
                <div className="max-w-2xl">
                    <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <span className="font-medium text-gray-700">Activar Envío Automático</span>
                            <input
                                type="checkbox"
                                checked={config.isEnabled}
                                onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                                className="w-5 h-5 text-eco-700 rounded"
                            />
                        </div>

                        {config.isEnabled && (
                            <div className="flex items-center gap-6 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.dailyReportEnabled}
                                        onChange={(e) => setConfig({ ...config, dailyReportEnabled: e.target.checked })}
                                        className="w-4 h-4 text-eco-700 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Reporte Diario (lunes a domingo)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.monthlyReportEnabled}
                                        onChange={(e) => setConfig({ ...config, monthlyReportEnabled: e.target.checked })}
                                        className="w-4 h-4 text-eco-700 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Reporte Mensual (el día 1 de cada mes)</span>
                                </label>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Hora de Envío</label>
                            <input
                                type="time"
                                value={config.scheduleTime}
                                onChange={(e) => setConfig({ ...config, scheduleTime: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Destinatarios</label>
                            <input
                                type="text"
                                value={config.recipients}
                                onChange={(e) => setConfig({ ...config, recipients: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900"
                                placeholder="email1@ejemplo.com, email2@ejemplo.com"
                            />
                            <p className="text-xs text-gray-500">Puedes enviar a múltiples correos separándolos por coma (,)</p>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-eco-700 text-white px-4 py-2 rounded-xl hover:bg-eco-800 transition"
                        >
                            Guardar Configuración
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'holidays' && (
                <div className="max-w-4xl space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Calendar size={20} className="text-eco-700" /> Agregar Feriado / No Laborable</h2>
                        <form onSubmit={handleAddHoliday} className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="w-full md:w-1/3 space-y-2">
                                <label className="text-sm font-medium text-gray-700">Fecha</label>
                                <input
                                    type="date"
                                    required
                                    value={newHoliday.date}
                                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900"
                                />
                            </div>
                            <div className="w-full md:w-1/2 space-y-2">
                                <label className="text-sm font-medium text-gray-700">Descripción (Ej: Día de la Bandera)</label>
                                <input
                                    type="text"
                                    required
                                    value={newHoliday.description}
                                    onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900"
                                    placeholder="Motivo del feriado"
                                />
                            </div>
                            <div className="w-full md:w-auto">
                                <button type="submit" className="w-full bg-eco-700 text-white px-6 py-2 rounded-lg hover:bg-eco-800 transition flex items-center gap-2">
                                    <Save size={18} /> Guardar
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 pl-6 w-1/4">Fecha</th>
                                    <th className="p-4 w-1/2">Descripción</th>
                                    <th className="p-4 text-right pr-6 w-1/4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {holidays.map(h => {
                                    const dateObj = new Date(h.date + 'T12:00:00');
                                    return (
                                        <tr key={h.id} className="hover:bg-eco-50/50 transition">
                                            <td className="p-4 pl-6 font-medium text-gray-900">
                                                {dateObj.toLocaleDateString('es-AR')}
                                            </td>
                                            <td className="p-4 text-gray-700">{h.description}</td>
                                            <td className="p-4 text-right pr-6">
                                                <button onClick={() => handleDeleteHoliday(h.id)} className="text-red-500 hover:text-red-700 transition p-1 bg-red-50 rounded-full hover:bg-red-100">
                                                    <XCircle size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {holidays.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-gray-500">
                                            No hay feriados o días no laborables cargados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
