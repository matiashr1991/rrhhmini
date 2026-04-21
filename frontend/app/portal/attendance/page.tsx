'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CalendarCheck, Clock, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AttendanceEvent {
    id: number;
    timestamp: string;
    deviceId: string;
    type: string;
}

export default function AttendancePage() {
    const [events, setEvents] = useState<AttendanceEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyAttendance();
    }, []);

    const fetchMyAttendance = async () => {
        try {
            const res = await api.get('/attendance/my-attendance');
            setEvents(res.data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarCheck className="text-eco-600" />
                        Mi Historial de Asistencia
                    </h1>
                    <p className="text-gray-500 text-sm">Registro de tus últimos 30 movimientos en el sistema.</p>
                </div>
                <Link 
                    href="/portal/dashboard"
                    className="flex items-center gap-2 text-sm font-medium text-eco-600 hover:text-eco-800 transition"
                >
                    <ArrowLeft size={16} />
                    Volver al Inicio
                </Link>
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl shadow-xl shadow-eco-900/5 border border-eco-50 overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="animate-spin mb-4" size={40} />
                        <p>Cargando tus registros...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="p-20 text-center text-gray-500">
                        <p className="text-lg font-medium">No se encontraron registros.</p>
                        <p className="text-sm">Si crees que esto es un error, contacta a Recursos Humanos.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-eco-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-eco-800 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-4 text-xs font-bold text-eco-800 uppercase tracking-wider">Hora</th>
                                    <th className="px-6 py-4 text-xs font-bold text-eco-800 uppercase tracking-wider">Dispositivo / Tipo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-eco-50">
                                {events.map((event) => {
                                    const date = new Date(event.timestamp);
                                    return (
                                        <tr key={event.id} className="hover:bg-eco-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-900 capitalize">
                                                    {format(date, "EEEE d 'de' MMMM", { locale: es })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-eco-600 font-bold">
                                                    <Clock size={16} />
                                                    {format(date, 'HH:mm:ss')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-700 flex items-center gap-1">
                                                        <MapPin size={14} className="text-gray-400" />
                                                        {event.deviceId === 'manual' ? 'Carga Manual' : `Reloj (${event.deviceId})`}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                                                        {event.type}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4 items-start">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                    <ArrowLeft className="rotate-180" size={20} />
                </div>
                <div className="text-xs text-amber-800 space-y-1">
                    <p className="font-bold">¿Falta alguna fichada?</p>
                    <p className="opacity-80">
                        Si notás que falta algún ingreso o egreso, comunicate con el área de Recursos Humanos para regularizar tu situación. 
                        Recordá que las fichadas manuales deben ser autorizadas.
                    </p>
                </div>
            </div>
        </div>
    );
}
