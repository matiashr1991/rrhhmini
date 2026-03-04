'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Search, Calendar, Filter, ChevronLeft, ChevronRight, Shield, LogIn, Plus, Pencil, Trash2, Check, X, Download } from 'lucide-react';

interface AuditEntry {
    id: number;
    userId: string;
    username: string;
    action: string;
    entity: string;
    entityId: string;
    details: any;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
}

interface AuditResponse {
    data: AuditEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    LOGIN: { label: 'Inicio Sesión', color: 'bg-eco-100 text-eco-800', icon: LogIn },
    CREATE: { label: 'Creación', color: 'bg-emerald-100 text-emerald-800', icon: Plus },
    UPDATE: { label: 'Modificación', color: 'bg-amber-100 text-amber-800', icon: Pencil },
    DELETE: { label: 'Eliminación', color: 'bg-red-100 text-red-800', icon: Trash2 },
    APPROVE: { label: 'Aprobación', color: 'bg-lapacho-100 text-lapacho-700', icon: Check },
    REJECT: { label: 'Rechazo', color: 'bg-orange-100 text-orange-800', icon: X },
    EXPORT: { label: 'Exportación', color: 'bg-gray-100 text-gray-800', icon: Download },
};

const ENTITY_LABELS: Record<string, string> = {
    Employee: 'Empleado',
    LeaveRequest: 'Licencia',
    LeaveType: 'Tipo Licencia',
    LeaveQuota: 'Cupo Licencia',
    Attendance: 'Asistencia',
    Notification: 'Notificación',
    User: 'Usuario',
    Auth: 'Autenticación',
    Report: 'Reporte',
    Category: 'Categoría',
    Jurisdiction: 'Jurisdicción',
    OrgUnit: 'Unidad Organizativa',
    Holiday: 'Feriado',
    EmailConfig: 'Config. Email',
};

export default function AuditPage() {
    const [data, setData] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', '30');
            if (search) params.set('search', search);
            if (actionFilter) params.set('action', actionFilter);
            if (entityFilter) params.set('entity', entityFilter);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const res = await api.get<AuditResponse>(`/audit-logs?${params.toString()}`);
            setData(res.data.data);
            setTotalPages(res.data.totalPages);
            setTotal(res.data.total);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, entityFilter, startDate, endDate]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchLogs();
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        }).format(d);
    };

    const getActionBadge = (action: string) => {
        const config = ACTION_CONFIG[action] || { label: action, color: 'bg-gray-100 text-gray-700', icon: Shield };
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                <Icon size={12} />
                {config.label}
            </span>
        );
    };

    const formatDetails = (details: any) => {
        if (!details) return '-';
        if (details.input) {
            const keys = Object.keys(details.input).filter(k => k !== 'type');
            if (keys.length === 0) return '-';
            return keys.slice(0, 3).map(k => `${k}: ${String(details.input[k]).substring(0, 30)}`).join(', ');
        }
        return JSON.stringify(details).substring(0, 80);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Shield className="text-eco-600" size={28} />
                        Registro de Auditoría
                    </h1>
                    <p className="text-gray-500 mt-1">Historial completo de acciones realizadas en el sistema.</p>
                </div>
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                    {total.toLocaleString()} registros totales
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="relative lg:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por usuario, entidad..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-eco-500/20 focus:border-eco-500 transition text-gray-900 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Action filter */}
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3">
                        <Filter size={16} className="text-gray-400 shrink-0" />
                        <select
                            className="w-full py-2.5 text-sm outline-none bg-transparent text-gray-900"
                            value={actionFilter}
                            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">Todas las acciones</option>
                            <option value="LOGIN">Inicio Sesión</option>
                            <option value="CREATE">Creación</option>
                            <option value="UPDATE">Modificación</option>
                            <option value="DELETE">Eliminación</option>
                            <option value="APPROVE">Aprobación</option>
                            <option value="REJECT">Rechazo</option>
                        </select>
                    </div>

                    {/* Date start */}
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3">
                        <Calendar size={16} className="text-gray-400 shrink-0" />
                        <input
                            type="date"
                            className="w-full py-2.5 text-sm outline-none bg-transparent text-gray-900"
                            value={startDate}
                            onChange={e => { setStartDate(e.target.value); setPage(1); }}
                            placeholder="Desde"
                        />
                    </div>

                    {/* Date end */}
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3">
                        <Calendar size={16} className="text-gray-400 shrink-0" />
                        <input
                            type="date"
                            className="w-full py-2.5 text-sm outline-none bg-transparent text-gray-900"
                            value={endDate}
                            onChange={e => { setEndDate(e.target.value); setPage(1); }}
                            placeholder="Hasta"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">Fecha / Hora</th>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Acción</th>
                                <th className="p-4">Entidad</th>
                                <th className="p-4">ID Registro</th>
                                <th className="p-4">Detalles</th>
                                <th className="p-4 pr-6">IP</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-5 h-5 border-2 border-eco-200 border-t-eco-600 rounded-full animate-spin" />
                                            Cargando registros...
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        No se encontraron registros con los filtros aplicados.
                                    </td>
                                </tr>
                            ) : data.map((entry) => (
                                <tr key={entry.id} className="hover:bg-eco-50/30 transition">
                                    <td className="p-4 pl-6 text-gray-600 whitespace-nowrap font-mono text-xs">
                                        {formatDate(entry.createdAt)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-eco-100 flex items-center justify-center text-eco-700 font-bold text-xs">
                                                {entry.username?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <span className="font-medium text-gray-900">{entry.username}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">{getActionBadge(entry.action)}</td>
                                    <td className="p-4 text-gray-700">
                                        {ENTITY_LABELS[entry.entity] || entry.entity || '-'}
                                    </td>
                                    <td className="p-4 font-mono text-xs text-gray-500">
                                        {entry.entityId ? entry.entityId.substring(0, 12) : '-'}
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs max-w-xs truncate" title={JSON.stringify(entry.details)}>
                                        {formatDetails(entry.details)}
                                    </td>
                                    <td className="p-4 pr-6 font-mono text-xs text-gray-400">
                                        {entry.ipAddress || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            Página {page} de {totalPages} ({total} registros)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            {/* Page buttons */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                                const pageNum = start + i;
                                if (pageNum > totalPages) return null;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition ${pageNum === page
                                            ? 'bg-eco-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
