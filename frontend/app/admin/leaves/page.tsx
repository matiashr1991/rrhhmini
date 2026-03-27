'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Check, X, Calendar, Search, Filter, History, PiggyBank, Settings2, Trash2 } from 'lucide-react';
import LeaveHistoryTab from './_components/LeaveHistoryTab';
import LeaveQuotasTab from './_components/LeaveQuotasTab';
import SearchableEmployeeSelect from './_components/SearchableEmployeeSelect';
import LeaveTypesTab from './_components/LeaveTypesTab';

interface LeaveRequest {
    id: number;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    comment: string;
    type: { name: string };
    employee: {
        firstName: string;
        lastName: string;
        employeeKey: string;
    };
}

export default function LeaveRequestsPage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('');
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'requests' | 'history' | 'quotas' | 'types'>('requests');
    const [newRequest, setNewRequest] = useState({
        employeeId: '',
        typeId: '',
        startDate: '',
        endDate: '',
        reason: ''
    });

    // Compute selected employee + selected leave type
    const selectedEmployee = employees.find((e: any) => e.id === newRequest.employeeId);
    const selectedLeaveType = leaveTypes.find((t: any) => String(t.id) === String(newRequest.typeId));
    const isVacaciones = selectedLeaveType?.name?.toLowerCase().includes('vacacion');

    /** LCT Art. 150 — years of service → vacation days */
    const calcVacationDays = (entryDate: string): number => {
        if (!entryDate) return 14;
        const diffMs = Date.now() - new Date(entryDate).getTime();
        const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
        if (years < 5) return 14;
        if (years < 10) return 21;
        if (years < 20) return 28;
        return 35;
    };

    const vacationEntitlement = selectedEmployee?.entryDate ? calcVacationDays(selectedEmployee.entryDate) : null;

    /** Count calendar days selected in the date range */
    const selectedDays = (() => {
        if (!newRequest.startDate || !newRequest.endDate) return 0;
        const ms = new Date(newRequest.endDate).getTime() - new Date(newRequest.startDate).getTime();
        if (ms < 0) return 0;
        return Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;
    })();

    useEffect(() => {
        fetchRequests();
        fetchTypes();
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchTypes = async () => {
        try {
            const res = await api.get('/leave-types');
            setLeaveTypes(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchRequests = async () => {
        try {
            const response = await api.get('/leave-requests');
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching leave requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        const comment = prompt(status === 'APPROVED' ? 'Comentario (opcional):' : 'Motivo del rechazo:');
        if (status === 'REJECTED' && !comment) return alert('Debes ingresar un motivo para rechazar.');

        try {
            await api.patch(`/leave-requests/${id}/status`, { status, comment });
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar estado');
        }
    };

    const handleDelete = async (id: number, employeeName: string) => {
        if (!confirm(`¿Eliminar definitivamente la solicitud de ${employeeName}? Esto liberará los días del cupo del empleado.`)) return;
        try {
            await api.delete(`/leave-requests/${id}`);
            fetchRequests();
        } catch (error) {
            console.error('Error deleting request:', error);
            alert('Error al eliminar la solicitud');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aprobado</span>;
            case 'REJECTED': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rechazado</span>;
            default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendiente</span>;
        }
    };

    const filteredRequests = filterType
        ? requests.filter(r => r.type?.name === filterType)
        : requests;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/leave-requests', {
                ...newRequest,
                type: { id: Number(newRequest.typeId) }
            });
            setIsModalOpen(false);
            setNewRequest({ employeeId: '', typeId: '', startDate: '', endDate: '', reason: '' });
            fetchRequests();
            if (res.data?.quotaWarning) {
                alert(`Solicitud creada, pero con advertencia:\n\n${res.data.quotaWarning}`);
            } else {
                alert('Solicitud creada exitosamente');
            }
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Error al crear solicitud');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Licencia</h1>
                    <p className="text-gray-500 mt-1">Gestiona las aprobaciones de licencias y permisos.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-eco-700 text-white px-4 py-2 rounded-lg hover:bg-eco-800 transition flex items-center gap-2 shadow-sm"
                    >
                        <Calendar size={18} /> Nueva Solicitud
                    </button>
                    {activeTab === 'requests' && (
                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200">
                            <Filter size={18} className="text-gray-400 ml-2" />
                            <select
                                className="p-1 text-sm outline-none bg-transparent text-gray-900"
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                            >
                                <option value="">Todos los tipos</option>
                                {leaveTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* TABS NAVIGATION */}
            <div className="flex border-b border-gray-200 mb-8 overflow-x-auto space-x-8">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-4 text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${activeTab === 'requests' ? 'border-b-2 border-eco-700 text-eco-700' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                >
                    <Calendar size={18} /> Solicitudes Activas
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-4 text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${activeTab === 'history' ? 'border-b-2 border-eco-700 text-eco-700' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                >
                    <History size={18} /> Historial
                </button>
                <button
                    onClick={() => setActiveTab('quotas')}
                    className={`pb-4 text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${activeTab === 'quotas' ? 'border-b-2 border-eco-700 text-eco-700' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                >
                    <PiggyBank size={18} /> Cupos Máximos
                </button>
                <button
                    onClick={() => setActiveTab('types')}
                    className={`pb-4 text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${activeTab === 'types' ? 'border-b-2 border-eco-700 text-eco-700' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                >
                    <Settings2 size={18} /> Tipos de Licencia
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Registrar Licencia</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
                                <SearchableEmployeeSelect
                                    employees={employees}
                                    value={newRequest.employeeId}
                                    onChange={(id) => setNewRequest({ ...newRequest, employeeId: id })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Licencia</label>
                                <select
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900"
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
                                        className="w-full border border-gray-300 rounded-lg p-2 text-gray-900"
                                        value={newRequest.startDate}
                                        onChange={e => setNewRequest({ ...newRequest, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2 text-gray-900"
                                        value={newRequest.endDate}
                                        onChange={e => setNewRequest({ ...newRequest, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Vacation entitlement panel */}
                            {isVacaciones && (
                                <div className={`rounded-xl p-4 border text-sm ${vacationEntitlement !== null && selectedDays > vacationEntitlement
                                        ? 'bg-red-50 border-red-200 text-red-800'
                                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    }`}>
                                    {selectedEmployee ? (
                                        <>
                                            <div className="font-semibold mb-1">🏖️ Cálculo de Vacaciones (LCT Art. 150)</div>
                                            {vacationEntitlement !== null ? (
                                                <>
                                                    <div>Antigüedad: <strong>{selectedEmployee.entryDate ? `${Math.floor((Date.now() - new Date(selectedEmployee.entryDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} años` : '(sin fecha de ingreso)'}</strong></div>
                                                    <div>Le corresponden: <strong className="text-lg">{vacationEntitlement} días</strong> de vacaciones</div>
                                                    {selectedDays > 0 && (
                                                        <div className="mt-1">
                                                            Período seleccionado: <strong>{selectedDays} días</strong>
                                                            {selectedDays > vacationEntitlement && (
                                                                <span className="ml-2 font-bold">⚠️ Excede el cupo ({selectedDays - vacationEntitlement} días extra)</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-amber-700">⚠️ Este empleado no tiene fecha de ingreso registrada. Verificar en el legajo.</div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-gray-600">Seleccioná un empleado para ver los días que le corresponden.</div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Observaciones</label>
                                <textarea
                                    required={!isVacaciones}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900"
                                    rows={3}
                                    placeholder={isVacaciones ? 'Opcional para vacaciones...' : 'Ingresá el motivo...'}
                                    value={newRequest.reason}
                                    onChange={e => setNewRequest({ ...newRequest, reason: e.target.value })}
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
                                    className="px-4 py-2 bg-eco-700 text-white rounded-lg hover:bg-eco-800 transition"
                                >
                                    Guardar Licencia
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'history' && <LeaveHistoryTab employees={employees} />}
            {activeTab === 'quotas' && <LeaveQuotasTab employees={employees} leaveTypes={leaveTypes} />}
            {activeTab === 'types' && <LeaveTypesTab />}

            {activeTab === 'requests' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 font-semibold text-sm uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 pl-6">Empleado</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Fechas</th>
                                    <th className="p-4">Motivo</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-right pr-6">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Cargando solicitudes...</td></tr>
                                ) : filteredRequests.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay solicitudes pendientes.</td></tr>
                                ) : filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 pl-6">
                                            <div className="font-medium text-gray-900">{req.employee?.lastName}, {req.employee?.firstName}</div>
                                            <div className="text-gray-500 text-xs">Legajo: {req.employee?.employeeKey}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-eco-50 text-eco-800 border border-eco-100">
                                                {req.type?.name || 'Otro'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span>{req.startDate}</span>
                                                {req.startDate !== req.endDate && (
                                                    <>
                                                        <span className="text-gray-400">➔</span>
                                                        <span>{req.endDate}</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-900 max-w-xs truncate" title={req.reason}>{req.reason}</div>
                                            {req.comment && <div className="text-gray-500 text-xs mt-1 italic">"{req.comment}"</div>}
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <div className="flex justify-end gap-2">
                                                {req.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusChange(req.id, 'APPROVED')}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                            title="Aprobar / Visto"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(req.id, 'REJECTED')}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            title="Rechazar"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(req.id, `${req.employee?.lastName} ${req.employee?.firstName}`)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Eliminar registro"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
