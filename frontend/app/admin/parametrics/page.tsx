'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import api from '@/lib/api';

const PARAMETRICS_CONFIG = [
    { key: 'maritalStatuses', label: 'Estado Civil' },
    { key: 'genders', label: 'Sexo / Género' },
    { key: 'jurisdictions', label: 'Jurisdicciones' },
    { key: 'orgUnits', label: 'Unidades de Organización' },
    { key: 'categories', label: 'Categorías' },
    { key: 'groupings', label: 'Agrupamientos' },
    { key: 'plantType1s', label: 'Planta 1 (Revista)' },
    { key: 'plantType2s', label: 'Planta 2 (Cargo)' },
    { key: 'functionAreas', label: 'Áreas de Función' },
    { key: 'workplaces', label: 'Lugares de Prestación (Lista)' },
    { key: 'retirementStatuses', label: 'Estados de Jubilación' },
];

export default function ParametricsPage() {
    const [selectedTab, setSelectedTab] = useState(PARAMETRICS_CONFIG[0].key);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [modalInputValue, setModalInputValue] = useState('');

    useEffect(() => {
        fetchData(selectedTab);
    }, [selectedTab]);

    const fetchData = async (tabKey: string) => {
        setLoading(true);
        try {
            const response = await api.get('/employees/parametrics');
            setData(response.data[tabKey] || []);
        } catch (error) {
            console.error('Error fetching parametrics:', error);
            alert('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item: any = null) => {
        setEditingItem(item);
        setModalInputValue(item ? (item.description || item.name || '') : '');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalInputValue.trim()) return;

        try {
            const payload = {
                // We use description or name depending on the entity, but backend will map appropriately if we send both for simplicity
                description: modalInputValue,
                name: modalInputValue
            };

            if (editingItem) {
                await api.put(`/employees/parametrics/${selectedTab}/${editingItem.id}`, payload);
            } else {
                await api.post(`/employees/parametrics/${selectedTab}`, payload);
            }
            setIsModalOpen(false);
            fetchData(selectedTab);
        } catch (error) {
            console.error('Error saving parametric log:', error);
            alert('Ocurrió un error al guardar el registro.');
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!confirm('¿Seguro que deseas eliminar este registro? Dependiendo de si se está usando, puede fallar debido a restricciones de integridad relacional en la base de datos.')) return;
        try {
            await api.delete(`/employees/parametrics/${selectedTab}/${id}`);
            fetchData(selectedTab);
        } catch (err) {
            alert('No se puede eliminar este registro porque probablemente esté en uso en uno o más empleados.');
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto text-gray-800">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition">
                        <ArrowLeft size={24} className="text-gray-500" />
                    </Link>
                    <h1 className="text-2xl font-bold">Administración de Catálogos (Paramétricas)</h1>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm font-medium"
                >
                    <Plus size={20} />
                    Agregar Nuevo
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">

                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 shrink-0">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Tablas Disponibles</h3>
                    <nav className="space-y-1">
                        {PARAMETRICS_CONFIG.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setSelectedTab(tab.key)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition text-sm font-medium ${selectedTab === tab.key ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold">{PARAMETRICS_CONFIG.find(t => t.key === selectedTab)?.label}</h2>
                        <p className="text-sm text-gray-500 mt-1">Gesti&oacute;n din&aacute;mica de atributos de carga de empleados.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">ID Interno</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Valor Visible (Descripción)</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {loading ? (
                                    <tr><td colSpan={3} className="text-center p-8 text-gray-500">Cargando datos...</td></tr>
                                ) : data.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center p-8 text-gray-500">No hay registros cargados aún en esta tabla.</td></tr>
                                ) : (
                                    data.map((item, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 font-mono text-gray-500 text-xs">{(item.id || '').toString().substring(0, 8)}...</td>
                                            <td className="px-6 py-4 font-medium">{item.description || item.name || '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold">{editingItem ? 'Editar Registro' : 'Nuevo Registro'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6">
                            <div className="space-y-2 mb-6 text-left">
                                <label className="text-sm font-medium text-gray-700">Valor / Descripción <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Ej: Casado/a"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-900"
                                    value={modalInputValue}
                                    onChange={(e) => setModalInputValue(e.target.value)}
                                />
                                <p className="text-xs text-gray-500">Este valor aparecerá en las listas desplegables al editar empleados.</p>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2">
                                    <Save size={16} />
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
