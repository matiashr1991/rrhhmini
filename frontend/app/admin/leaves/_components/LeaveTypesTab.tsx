'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Pencil, Trash2, Plus, X, Check, Calendar, Clock } from 'lucide-react';

interface LeaveType {
    id: number;
    name: string;
    description: string;
    requiresApproval: boolean;
    isActive: boolean;
    maxDaysPerYear: number | null;
    maxDaysPerMonth: number | null;
}

const emptyForm = (): Partial<LeaveType> => ({
    name: '',
    description: '',
    requiresApproval: false,
    maxDaysPerYear: null,
    maxDaysPerMonth: null,
});

export default function LeaveTypesTab() {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<LeaveType>>(emptyForm());

    const fetchLeaveTypes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/leave-types');
            setLeaveTypes(res.data);
        } catch (error) {
            console.error('Error fetching leave types:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeaveTypes(); }, []);

    const handleOpenModal = (type?: LeaveType) => {
        if (type) {
            setEditingId(type.id);
            setFormData({
                name: type.name,
                description: type.description || '',
                requiresApproval: type.requiresApproval,
                maxDaysPerYear: type.maxDaysPerYear ?? null,
                maxDaysPerMonth: type.maxDaysPerMonth ?? null,
            });
        } else {
            setEditingId(null);
            setFormData(emptyForm());
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        // Convert empty strings to null for the numeric fields
        const payload = {
            ...formData,
            maxDaysPerYear: formData.maxDaysPerYear === null || formData.maxDaysPerYear === undefined ? null : Number(formData.maxDaysPerYear),
            maxDaysPerMonth: formData.maxDaysPerMonth === null || formData.maxDaysPerMonth === undefined ? null : Number(formData.maxDaysPerMonth),
        };
        try {
            if (editingId) {
                await api.put(`/leave-types/${editingId}`, payload);
            } else {
                await api.post('/leave-types', payload);
            }
            setIsModalOpen(false);
            fetchLeaveTypes();
        } catch (error) {
            console.error('Error saving leave type:', error);
            alert('Error al guardar el tipo de licencia');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar (dar de baja) este tipo de licencia?')) return;
        try {
            await api.delete(`/leave-types/${id}`);
            fetchLeaveTypes();
        } catch (error) {
            console.error('Error deleting leave type:', error);
            alert('Error al eliminar');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando tipos de licencia...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Gestión de Tipos de Licencia</h3>
                    <p className="text-sm text-gray-500 mt-1">Los límites se aplican de forma <strong>independiente por tipo</strong>. Cada tipo tiene su propio contador.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-eco-700 hover:bg-eco-800 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
                >
                    <Plus size={18} /> Nuevo Tipo
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Aprobación?</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Máx/Año</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Máx/Mes</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {leaveTypes.map(type => (
                                <tr key={type.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 text-sm font-medium text-gray-900">{type.name}</td>
                                    <td className="p-4 text-sm text-gray-600">{type.description || '-'}</td>
                                    <td className="p-4 text-center">
                                        {type.requiresApproval ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                <Check size={12} /> Sí
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                Aviso
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {type.maxDaysPerYear !== null && type.maxDaysPerYear !== undefined ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-eco-50 text-eco-800 border border-eco-100">
                                                <Calendar size={11} /> {type.maxDaysPerYear}d
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">Ilimitado</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {type.maxDaysPerMonth !== null && type.maxDaysPerMonth !== undefined ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">
                                                <Clock size={11} /> {type.maxDaysPerMonth}d
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">Sin límite</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(type)}
                                                className="p-1.5 text-gray-500 hover:text-eco-700 hover:bg-eco-50 rounded transition"
                                                title="Editar"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(type.id)}
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {leaveTypes.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No hay tipos de licencia configurados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal ABM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingId ? 'Editar Tipo de Licencia' : 'Nuevo Tipo de Licencia'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-eco-600 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Licencia por Matrimonio"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-eco-600 outline-none min-h-[72px]"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Quota limits */}
                            <div className="p-4 bg-eco-50 rounded-xl border border-eco-100 space-y-3">
                                <div className="text-sm font-semibold text-eco-900">Límites de cuota (independientes por tipo)</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Días máximos por año</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-eco-600 outline-none text-sm"
                                            placeholder="Vacío = ilimitado"
                                            value={formData.maxDaysPerYear ?? ''}
                                            onChange={e => setFormData({ ...formData, maxDaysPerYear: e.target.value === '' ? null : parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Días máximos por mes</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-eco-600 outline-none text-sm"
                                            placeholder="Vacío = sin límite"
                                            value={formData.maxDaysPerMonth ?? ''}
                                            onChange={e => setFormData({ ...formData, maxDaysPerMonth: e.target.value === '' ? null : parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-eco-700">Dejar vacío = sin límite. Cada tipo tiene su propio contador, no comparten cuota entre sí.</p>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 text-eco-700 rounded border-gray-300 focus:ring-eco-600"
                                    checked={formData.requiresApproval}
                                    onChange={e => setFormData({ ...formData, requiresApproval: e.target.checked })}
                                />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Requiere Aprobación</div>
                                    <div className="text-xs text-gray-500">Si se desmarca, se tratará como un aviso que se auto-aprueba.</div>
                                </div>
                            </label>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-eco-700 text-white rounded-lg font-medium hover:bg-eco-800 transition">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
