'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Calendar, Plus, X, Clock, CheckCircle, XCircle } from 'lucide-react';

interface LeaveRequest {
    id: number;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    comment: string;
    type: { name: string };
    createdAt: string;
}

export default function MyLeavesPage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRequest, setNewRequest] = useState({
        typeId: '',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [balanceInfo, setBalanceInfo] = useState<{ maxDays: number, remainingDays: number } | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);

    // We need the employeeId. It's stored in the JWT but we can get it from the user profile or an endpoint.
    // For now, let's fetch the /auth/me or similar to dynamically get their ID to query the balance.
    const [employeeId, setEmployeeId] = useState<string>('');

    useEffect(() => {
        fetchMyRequests();
        fetchTypes();
    }, []);

    const fetchMyRequests = async () => {
        try {
            const res = await api.get('/leave-requests/my-requests');
            setRequests(res.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTypes = async () => {
        try {
            const res = await api.get('/leave-types');
            setLeaveTypes(res.data);

            // Also try to get employeeId from an endpoint if possible
            const empRes = await api.get('/auth/me'); // Assuming we have this, or we get it from token
            if (empRes.data.employeeId) {
                setEmployeeId(empRes.data.employeeId);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // Fallback: decode JWT token to get employeeId
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.employeeId) setEmployeeId(payload.employeeId);
                } catch (e) { }
            }
        }
    };

    useEffect(() => {
        if (newRequest.typeId && employeeId && newRequest.startDate) {
            const year = new Date(newRequest.startDate).getFullYear() || new Date().getFullYear();
            fetchBalance(newRequest.typeId, year);
        } else {
            setBalanceInfo(null);
        }
    }, [newRequest.typeId, newRequest.startDate, employeeId]);

    const fetchBalance = async (typeId: string, year: number) => {
        setLoadingBalance(true);
        try {
            const res = await api.get(`/leave-quotas/balance?employeeId=${employeeId}&leaveTypeId=${typeId}&year=${year}`);
            setBalanceInfo(res.data); // data can be null if unlimited
        } catch (error) {
            console.error('Error fetching balance:', error);
        } finally {
            setLoadingBalance(false);
        }
    };

    const requestedDays = (() => {
        if (!newRequest.startDate || !newRequest.endDate) return 0;
        const start = new Date(newRequest.startDate).getTime();
        const end = new Date(newRequest.endDate).getTime();
        if (end < start) return 0;
        return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
    })();

    const isExceeded = balanceInfo !== null && requestedDays > balanceInfo.remainingDays;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isExceeded) {
            alert('No tienes suficientes días disponibles para esta solicitud.');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/leave-requests', {
                ...newRequest,
                type: { id: Number(newRequest.typeId) }
            });
            setIsModalOpen(false);
            setNewRequest({ typeId: '', startDate: '', endDate: '', reason: '' });
            fetchMyRequests(); // Refresh list
            alert('Solicitud enviada correctamente');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Error al enviar solicitud';
            alert(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} /> Aprobada</span>;
            case 'REJECTED': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} /> Rechazada</span>;
            default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} /> Pendiente</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mis Licencias</h1>
                    <p className="text-gray-500 text-sm">Historial de solicitudes y permisos.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-eco-700 text-white px-4 py-2 rounded-lg hover:bg-eco-800 transition flex items-center justify-center gap-2 shadow-sm font-medium w-full sm:w-auto"
                >
                    <Plus size={18} />
                    Nueva Solicitud
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Nueva Licencia</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Licencia</label>
                                <select
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-eco-600/20 focus:border-eco-600 outline-none"
                                    value={newRequest.typeId}
                                    onChange={e => setNewRequest({ ...newRequest, typeId: e.target.value })}
                                >
                                    <option value="">Seleccionar tipo...</option>
                                    {leaveTypes.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-eco-600/20 focus:border-eco-600 outline-none"
                                        value={newRequest.startDate}
                                        onChange={e => setNewRequest({ ...newRequest, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-eco-600/20 focus:border-eco-600 outline-none"
                                        value={newRequest.endDate}
                                        onChange={e => setNewRequest({ ...newRequest, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Balance visualizer */}
                            {loadingBalance ? (
                                <div className="text-sm text-gray-500">Calculando saldo disponible...</div>
                            ) : balanceInfo ? (
                                <div className={`p-3 rounded-lg text-sm border ${balanceInfo.remainingDays > 0 ? 'bg-eco-50 border-eco-100 text-eco-900' : 'bg-red-50 border-red-100 text-red-800'}`}>
                                    <strong>Saldo de días:</strong> Te quedan <strong>{balanceInfo.remainingDays}</strong> de {balanceInfo.maxDays} días para este año.
                                    {/* Ignore TS error on limitReason since it works in runtime, but cast safely anyway */}
                                    {(balanceInfo as any).limitReason && (
                                        <div className="mt-1 text-xs bg-white/50 px-2 py-1 rounded inline-block text-gray-700">
                                            <strong>Aviso:</strong> Está aplicando la restricción: {(balanceInfo as any).limitReason}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                newRequest.typeId && newRequest.startDate && (
                                    <div className="p-3 rounded-lg text-sm bg-green-50 border border-green-100 text-green-800">
                                        Esta licencia no tiene un cupo máximo asignado.
                                    </div>
                                )
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                                <textarea
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-eco-600/20 focus:border-eco-600 outline-none"
                                    rows={3}
                                    value={newRequest.reason}
                                    onChange={e => setNewRequest({ ...newRequest, reason: e.target.value })}
                                    placeholder="Explica brevemente el motivo..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || isExceeded}
                                    className="px-4 py-2 bg-eco-700 text-white rounded-lg hover:bg-eco-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando historial...</div>
                ) : requests.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
                            <Calendar size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Sin solicitudes</h3>
                        <p className="text-gray-500 mt-1">No tienes licencias registradas.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {requests.map(req => (
                            <div key={req.id} className="p-4 hover:bg-gray-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900">{req.type?.name || 'Licencia'}</span>
                                        {getStatusBadge(req.status)}
                                    </div>
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-400" />
                                        <span>{req.startDate}</span>
                                        <span className="text-gray-300">➜</span>
                                        <span>{req.endDate}</span>
                                    </div>
                                    {req.comment && (
                                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                                            <strong>Motivo rechazo:</strong> {req.comment}
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400">
                                    Solicitado el {new Date(req.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
