'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Search, UserPlus, Trash2, Pencil, X, ShieldCheck, User, Users } from 'lucide-react';

interface SystemUser {
    id: string;
    username: string;
    role: string;
    createdAt: string;
    employee?: {
        id: string;
        firstName: string;
        lastName: string;
        dni: string;
    };
}

const ROLES = [
    { value: 'admin', label: 'Administrador', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'administrative', label: 'Administrativo', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'employee', label: 'Empleado', color: 'bg-green-100 text-green-800 border-green-200' },
];

function getRoleBadge(role: string) {
    const r = ROLES.find(r => r.value === role);
    if (!r) return <span className="text-xs text-gray-500">{role}</span>;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${r.color}`}>
            {r.value === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
            {r.label}
        </span>
    );
}

export default function SettingsPage() {
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

    // DNI lookup state
    const [dniSearch, setDniSearch] = useState('');
    const [foundEmployee, setFoundEmployee] = useState<any>(null);
    const [lookingUp, setLookingUp] = useState(false);
    const [dniError, setDniError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        password: '',
        role: 'employee',
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleDniLookup = async () => {
        if (!dniSearch.trim()) return;
        setLookingUp(true);
        setDniError('');
        setFoundEmployee(null);
        try {
            const res = await api.get(`/employees/by-dni/${dniSearch.trim()}`);
            if (res.data) {
                setFoundEmployee(res.data);
            } else {
                setDniError('No se encontró ningún empleado con ese DNI.');
            }
        } catch {
            setDniError('No se encontró ningún empleado con ese DNI.');
        } finally {
            setLookingUp(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingUser(null);
        setFoundEmployee(null);
        setDniSearch('');
        setDniError('');
        setFormData({ password: '', role: 'employee' });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: SystemUser) => {
        setEditingUser(user);
        setFoundEmployee(user.employee || null);
        setDniSearch('');
        setDniError('');
        setFormData({ password: '', role: user.role });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.put(`/auth/users/${editingUser.id}`, {
                    role: formData.role,
                    ...(formData.password ? { password: formData.password } : {}),
                });
            } else {
                if (!foundEmployee) return;
                await api.post('/auth/users', {
                    username: foundEmployee.dni,
                    password: formData.password,
                    role: formData.role,
                    employeeId: foundEmployee.id,
                });
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error al guardar';
            alert(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    const handleDelete = async (user: SystemUser) => {
        if (!confirm(`¿Eliminar el acceso al usuario "${user.employee?.lastName ?? user.username}"? Esta acción no se puede deshacer.`)) return;
        try {
            await api.delete(`/auth/users/${user.id}`);
            fetchUsers();
        } catch {
            alert('Error al eliminar');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestión de cuentas de acceso al sistema.</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 shadow-sm"
                >
                    <UserPlus size={18} /> Nuevo Usuario
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                    <Users size={18} className="text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Usuarios del Sistema</h3>
                    <span className="ml-auto text-sm text-gray-400">{users.length} usuario{users.length !== 1 ? 's' : ''}</span>
                </div>
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando usuarios...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empleado</th>
                                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario (DNI)</th>
                                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Creado</th>
                                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-gray-900">
                                            {user.employee ? `${user.employee.lastName}, ${user.employee.firstName}` : <span className="text-gray-400 italic">Sin empleado vinculado</span>}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 font-mono">{user.username}</td>
                                        <td className="p-4">{getRoleBadge(user.role)}</td>
                                        <td className="p-4 text-sm text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">
                                            <div className="inline-flex gap-1">
                                                <button
                                                    onClick={() => handleOpenEditModal(user)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                                    title="Editar rol / contraseña"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                    title="Eliminar acceso"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-400">No hay usuarios creados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingUser ? 'Editar Acceso' : 'Nuevo Acceso al Sistema'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            {/* DNI Lookup (Create only) */}
                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Empleado por DNI</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Ej: 35004215"
                                            value={dniSearch}
                                            onChange={e => { setDniSearch(e.target.value); setFoundEmployee(null); setDniError(''); }}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleDniLookup(); } }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleDniLookup}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
                                            disabled={lookingUp}
                                        >
                                            <Search size={18} />
                                        </button>
                                    </div>
                                    {dniError && <p className="text-red-600 text-xs mt-1">{dniError}</p>}
                                    {foundEmployee && (
                                        <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-800">
                                            <strong>Encontrado:</strong> {foundEmployee.lastName}, {foundEmployee.firstName}
                                            <div className="text-xs text-green-600 mt-0.5">El usuario se creará con el DNI como nombre de usuario.</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Edit: show who we're editing */}
                            {editingUser && (
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900">
                                    <strong>Editando:</strong> {editingUser.employee ? `${editingUser.employee.lastName}, ${editingUser.employee.firstName}` : editingUser.username}
                                    <div className="text-xs text-blue-600 mt-0.5">Usuario: {editingUser.username}</div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {ROLES.map(r => (
                                        <button
                                            key={r.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: r.value })}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition border-2 ${formData.role === r.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {editingUser ? 'Nueva Contraseña (dejar vacío para no cambiarla)' : 'Contraseña inicial'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder={editingUser ? '(Sin cambios)' : 'Mínimo 4 caracteres'}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    minLength={editingUser ? undefined : 4}
                                />
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!editingUser && !foundEmployee}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
