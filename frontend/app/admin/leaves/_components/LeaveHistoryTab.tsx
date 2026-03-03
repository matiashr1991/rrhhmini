'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Calendar, Search } from 'lucide-react';
import SearchableEmployeeSelect from './SearchableEmployeeSelect';

interface LeaveRequest {
    id: number;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    type: { name: string };
}

export default function LeaveHistoryTab({ employees }: { employees: any[] }) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [history, setHistory] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedEmployeeId) {
            setHistory([]);
            return;
        }

        const fetchHistory = async () => {
            setLoading(true);
            try {
                // To display history we can reuse the GET /leave-requests endpoint by filtering on the frontend, 
                // but a better approach is an endpoint. For now, since we already have getAll, we can filter locally or fetch and filter.
                const res = await api.get('/leave-requests');
                const filtered = res.data.filter((req: any) => String(req.employee?.id) === String(selectedEmployeeId));
                setHistory(filtered);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [selectedEmployeeId]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Aprobado</span>;
            case 'REJECTED': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Rechazado</span>;
            default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Pendiente</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-end gap-4">
                <div className="flex-1 max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Historial de Empleado</label>
                    <SearchableEmployeeSelect
                        employees={employees}
                        value={selectedEmployeeId}
                        onChange={(id) => setSelectedEmployeeId(id)}
                        placeholder="Buscar por DNI, Nombre o Legajo..."
                    />
                </div>
            </div>

            {selectedEmployeeId && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar size={18} className="text-gray-500" /> Historial de Licencias y Faltas
                        </h3>
                        <span className="text-sm text-gray-500">{history.length} registros encontrados</span>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Cargando...</div>
                    ) : history.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No hay registros para este empleado.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {history.map(req => (
                                <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-semibold text-gray-900">{req.type?.name || 'Otro'}</span>
                                            {getStatusBadge(req.status)}
                                        </div>
                                        <p className="text-sm text-gray-600">{req.reason}</p>
                                    </div>
                                    <div className="text-right text-sm text-gray-500 whitespace-nowrap">
                                        {req.startDate} {req.startDate !== req.endDate ? ` ➔ ${req.endDate}` : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
