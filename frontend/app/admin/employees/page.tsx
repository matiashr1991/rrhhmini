'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserPlus, Pencil, Trash2, Search } from 'lucide-react';

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    employeeKey: string;
    dni?: string;
    email: string;
    category?: { description: string };
    jurisdiction?: { name: string };
    isActive: boolean;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/employees');
            setEmployees(response.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este empleado?')) return;
        try {
            await api.delete(`/employees/${id}`);
            // Soft delete: update state to inactive instead of removing
            setEmployees(employees.map(e => e.id === id ? { ...e, isActive: false } : e));
        } catch (error) {
            console.error('Error deleting employee:', error);
            alert('Error al eliminar empleado');
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeKey.includes(searchTerm) ||
        (emp.dni && emp.dni.includes(searchTerm))
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Personal</h1>
                    <p className="text-gray-500 mt-1">Administra los legajos y datos de los empleados.</p>
                </div>
                <Link
                    href="/admin/employees/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 font-medium"
                >
                    <UserPlus size={20} />
                    Nuevo Empleado
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, legajo o DNI..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-semibold text-sm uppercase tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">Legajo</th>
                                <th className="p-4">Empleado</th>
                                <th className="p-4">Categoría</th>
                                <th className="p-4">Jurisdicción</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 text-right pr-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Cargando datos...</td></tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No se encontraron empleados.</td></tr>
                            ) : filteredEmployees.map((emp) => (
                                <tr key={emp.id} className="hover:bg-blue-50/30 transition group">
                                    <td className="p-4 pl-6 font-mono text-gray-600">{emp.employeeKey}</td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{emp.lastName}, {emp.firstName}</div>
                                        <div className="text-gray-500 text-xs">{emp.email}</div>
                                    </td>
                                    <td className="p-4 text-gray-600">{emp.category?.description || '-'}</td>
                                    <td className="p-4 text-gray-600">{emp.jurisdiction?.name || '-'}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {emp.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/admin/employees/${emp.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                <Pencil size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(emp.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-100 text-xs text-gray-500 text-center">
                    Mostrando {filteredEmployees.length} registros
                </div>
            </div>
        </div>
    );
}
