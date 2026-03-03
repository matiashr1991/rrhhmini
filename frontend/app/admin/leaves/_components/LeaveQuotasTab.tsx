'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Save } from 'lucide-react';
import SearchableEmployeeSelect from './SearchableEmployeeSelect';

export default function LeaveQuotasTab({ employees, leaveTypes }: { employees: any[]; leaveTypes: any[] }) {
    const [quotas, setQuotas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [maxDays, setMaxDays] = useState('');

    useEffect(() => {
        fetchQuotas(year);
    }, [year]);

    const fetchQuotas = async (selectedYear: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/leave-quotas?year=${selectedYear}`);
            setQuotas(res.data);
        } catch (error) {
            console.error('Error fetching quotas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/leave-quotas', {
                employeeId: selectedEmployee,
                leaveTypeId: Number(selectedType),
                year: Number(year),
                maxDays: Number(maxDays)
            });
            alert('Cupo guardado correctamente');
            fetchQuotas(year);
            setSelectedEmployee('');
            setSelectedType('');
            setMaxDays('');
        } catch (error) {
            console.error(error);
            alert('Error al guardar el cupo');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Configurar Saldos (Cupos Maximos)</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
                        <SearchableEmployeeSelect
                            employees={employees}
                            value={selectedEmployee}
                            onChange={(id) => setSelectedEmployee(id)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Licencia</label>
                        <select
                            required
                            className="w-full border border-gray-300 rounded-lg p-2 text-gray-900"
                            value={selectedType}
                            onChange={e => setSelectedType(e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Días Máx. ({year})</label>
                        <input
                            type="number"
                            required
                            min="1"
                            placeholder="Ej: 14"
                            className="w-full border border-gray-300 rounded-lg p-2 text-gray-900"
                            value={maxDays}
                            onChange={e => setMaxDays(e.target.value)}
                        />
                    </div>
                    <div>
                        <button type="submit" className="w-full flex justify-center items-center gap-2 bg-eco-700 text-white rounded-lg p-2 hover:bg-eco-800 transition">
                            <Save size={18} /> Guardar
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Cupos Asignados</h3>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Año:</label>
                        <select
                            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                            value={year}
                            onChange={e => setYear(e.target.value)}
                        >
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium uppercase tracking-wider text-xs">
                        <tr>
                            <th className="p-4">Empleado</th>
                            <th className="p-4">Tipo Licencia</th>
                            <th className="p-4 text-center">Cupo Total Días</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={3} className="p-8 text-center text-gray-500">Cargando...</td></tr>
                        ) : quotas.length === 0 ? (
                            <tr><td colSpan={3} className="p-8 text-center text-gray-500">No hay cupos definidos para este año.</td></tr>
                        ) : quotas.map(q => (
                            <tr key={q.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-900">{q.employee?.lastName}, {q.employee?.firstName}</td>
                                <td className="p-4 text-eco-700">{q.leaveType?.name}</td>
                                <td className="p-4 text-center font-bold text-gray-800">{q.maxDays}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
