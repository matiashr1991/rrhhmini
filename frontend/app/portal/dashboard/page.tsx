'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Ambulance, CalendarX, Clock, CheckCircle, XCircle } from 'lucide-react';

interface LeaveType {
    id: number;
    name: string;
    description: string;
}

interface LeaveRequest {
    id: number;
    startDate: string;
    endDate: string;
    status: string;
    type: { name: string };
    createdAt: string;
}

export default function PortalDashboard() {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch types and my requests (we might need a specific endpoint for 'my-requests')
            // For now, let's assume specific leave types IDs or find them by name
            const [typesRes, requestsRes] = await Promise.all([
                api.get('/leave-types'), // Public or protected
                api.get('/leave-requests/my-requests') // We need to implement this endpoint or filter in frontend
            ]);
            setLeaveTypes(typesRes.data);
            setMyRequests(requestsRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickNotice = async (typeName: string) => {
        if (!confirm(`¿Confirmas enviar un ${typeName}?`)) return;

        const type = leaveTypes.find(t => t.name === typeName);
        if (!type) {
            alert('Tipo de licencia no configurado.');
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            await api.post('/leave-requests', {
                type: { id: type.id },
                startDate: today,
                endDate: today,
                reason: `${typeName} - Aviso Rápido`
            });
            alert('Aviso enviado correctamente.');
            fetchData();
        } catch (error: any) {
            console.error('Error sending notice:', error);
            const msg = error.response?.data?.message || 'Error al enviar el aviso.';
            alert(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-600/20">
                <h1 className="text-3xl font-bold mb-2">Hola!</h1>
                <p className="opacity-90">Bienvenido a tu portal de autogestión.</p>
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Avisos Rápidos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => handleQuickNotice('Aviso de Falta')}
                        className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition group text-left"
                    >
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                            <CalendarX size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Avisar Falta</h3>
                            <p className="text-sm text-gray-500">Notificar ausencia por imprevisto</p>
                        </div>
                    </button>

                    <button
                        onClick={() => handleQuickNotice('Licencia por Enfermedad')}
                        className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-red-200 transition group text-left"
                    >
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                            <Ambulance size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Avisar Enfermedad</h3>
                            <p className="text-sm text-gray-500">Notificar carpeta médica (48hs)</p>
                        </div>
                    </button>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Mis Últimos Avisos</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {myRequests.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No tienes avisos recientes.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {myRequests.map(req => (
                                <div key={req.id} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{req.type?.name || 'Licencia'}</div>
                                            <div className="text-xs text-gray-500">{req.startDate}</div>
                                        </div>
                                    </div>
                                    <div>
                                        {req.status === 'APPROVED' && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Visto</span>}
                                        {req.status === 'PENDING' && <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Enviado</span>}
                                        {req.status === 'REJECTED' && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Rechazado</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
