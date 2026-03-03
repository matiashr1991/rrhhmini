'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function TestLeaveRequestPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        employeeId: '',
        startDate: '',
        endDate: '',
        reason: '',
    });

    useEffect(() => {
        api.get('/employees').then(res => setEmployees(res.data));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/leave-requests', formData);
            alert('Solicitud creada');
            setFormData({ ...formData, reason: '' }); // Clear reason
        } catch (error) {
            console.error(error);
            alert('Error creando solicitud');
        }
    };

    return (
        <div className="p-8 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Simular Solicitud (Test)</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Empleado</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={formData.employeeId}
                        onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                        required
                    >
                        <option value="">Seleccionar...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.lastName}, {e.firstName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Desde</label>
                    <input
                        type="date"
                        className="w-full border p-2 rounded"
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Hasta</label>
                    <input
                        type="date"
                        className="w-full border p-2 rounded"
                        value={formData.endDate}
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Motivo</label>
                    <textarea
                        className="w-full border p-2 rounded"
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                        required
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Enviar Solicitud</button>
            </form>
        </div>
    );
}
