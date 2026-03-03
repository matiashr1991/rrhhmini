'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import api from '@/lib/api';

interface Parametric {
    id: string | number;
    name?: string;
    description?: string;
}

interface ParametricsData {
    categories: Parametric[];
    jurisdictions: Parametric[];
    maritalStatuses: Parametric[];
    genders: Parametric[];
    orgUnits: Parametric[];
    groupings: Parametric[];
    plantType1s: Parametric[];
    plantType2s: Parametric[];
    functionAreas: Parametric[];
    workplaces: Parametric[];
    retirementStatuses: Parametric[];
}

interface EmployeeFormProps {
    initialData?: any;
    isEdit?: boolean;
    onSubmit: (data: any) => Promise<void>;
    title: string;
}

export default function EmployeeForm({ initialData, isEdit, onSubmit, title }: EmployeeFormProps) {
    const router = useRouter();

    const [formData, setFormData] = useState({
        // Personales
        employeeKey: '',
        dni: '',
        legacyNumber: '',
        cuit: '',
        fileNumber: '',
        firstName: '',
        lastName: '',
        genderId: '',
        birthDate: '',
        maritalStatusId: '',
        childrenCount: 0,
        // Contacto
        address: '',
        email: '',
        phone: '',
        // Laborales
        entryDate: '',
        jurisdictionId: '',
        orgUnitId: '',
        categoryId: '',
        groupingId: '',
        plantType1Id: '',
        plantType2Id: '',
        workplaceLocation: '',
        // Función
        functionNumber: '',
        functionDescription: '',
        functionAreaId: '',
        designationDevice: '',
        workplaceId: '',
        // Sumario y Legales
        hasSummary: false,
        summaryStartDate: '',
        summaryFileNumber: '',
        // Jubilación
        retirementStatusId: '',
        retirementFileNumber: '',
        // Otros
        hasDigitalSignature: false,
        lastRecategorizationDate: '',
        isActive: true,
        ...initialData,
    });

    // Helper para formatear fechas de YYYY-MM-DDTHH:MM... a YYYY-MM-DD para el input type date
    useEffect(() => {
        if (initialData) {
            const formatted = { ...initialData };
            ['birthDate', 'entryDate', 'summaryStartDate', 'lastRecategorizationDate'].forEach(field => {
                if (formatted[field]) {
                    formatted[field] = formatted[field].split('T')[0];
                }
            });
            // Mapear IDs de relaciones a campos planos para el state del formulario
            ['gender', 'maritalStatus', 'jurisdiction', 'orgUnit', 'category', 'grouping', 'plantType1', 'plantType2', 'functionArea', 'workplace', 'retirementStatus'].forEach(rel => {
                if (formatted[rel]) {
                    formatted[`${rel}Id`] = formatted[rel].id;
                }
            });
            setFormData((prev: typeof formData) => ({ ...prev, ...formatted }));
        }
    }, [initialData]);

    const [parametrics, setParametrics] = useState<ParametricsData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchParametrics = async () => {
            try {
                const res = await api.get('/employees/parametrics');
                setParametrics(res.data);
            } catch (error) {
                console.error('Error fetching parametrics:', error);
            }
        };
        fetchParametrics();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        const name = e.target.name;
        setFormData((prev: typeof formData) => ({
            ...prev,
            [name]: e.target.type === 'number' ? (value ? Number(value) : '') : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const {
                genderId, maritalStatusId, jurisdictionId, orgUnitId, categoryId,
                groupingId, plantType1Id, plantType2Id, functionAreaId, workplaceId,
                retirementStatusId,
                ...cleanData
            } = formData;

            // Map flat IDs back to objects for TypeORM relations
            const payload: any = {
                ...cleanData,
                gender: genderId ? { id: genderId } : null,
                maritalStatus: maritalStatusId ? { id: maritalStatusId } : null,
                jurisdiction: jurisdictionId ? { id: jurisdictionId } : null,
                orgUnit: orgUnitId ? { id: orgUnitId } : null,
                category: categoryId ? { id: categoryId } : null,
                grouping: groupingId ? { id: groupingId } : null,
                plantType1: plantType1Id ? { id: plantType1Id } : null,
                plantType2: plantType2Id ? { id: plantType2Id } : null,
                functionArea: functionAreaId ? { id: functionAreaId } : null,
                workplace: workplaceId ? { id: workplaceId } : null,
                retirementStatus: retirementStatusId ? { id: retirementStatusId } : null,
            };

            // Clean up empty strings to null to prevent Postgres Type casting and Unique Constraint errors
            Object.keys(payload).forEach(key => {
                if (payload[key] === '') {
                    payload[key] = null;
                }
            });

            await onSubmit(payload);
        } catch (error: any) {
            console.error('Error submitting form:', error);
            const message = error.response?.data?.message || 'Error al guardar';
            alert(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

    const renderSelect = (name: string, label: string, options: Parametric[] = []) => (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <select
                name={name}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-900 bg-white"
                value={(formData as any)[name] || ''}
                onChange={handleChange}
            >
                <option value="">Seleccionar...</option>
                {(options || []).map(o => (
                    <option key={o.id} value={o.id}>{o.description || o.name}</option>
                ))}
            </select>
        </div>
    );

    interface ValidationProps {
        min?: string | number;
        max?: string | number;
        minLength?: number;
        maxLength?: number;
        pattern?: string;
        title?: string;
    }

    const renderInput = (name: string, label: string, type = 'text', required = false, validation?: ValidationProps) => (
        <div className="space-y-1 relative">
            <label className="text-sm font-medium text-gray-700">{label} {required && '*'}</label>
            <input
                type={type}
                name={name}
                required={required}
                {...validation}
                placeholder=" "
                className={`
                    w-full px-4 py-2 rounded-lg border border-gray-200 transition text-gray-900 peer
                    focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
                    [&:not(:placeholder-shown):invalid]:border-red-500 [&:not(:placeholder-shown):invalid]:ring-1 [&:not(:placeholder-shown):invalid]:ring-red-500
                `}
                value={(formData as any)[name] ?? ''}
                onChange={handleChange}
            />
            <span className="text-xs text-red-500 font-medium hidden peer-[&:not(:placeholder-shown):invalid]:block">
                {validation?.title || (required ? 'Este campo es requerido o tiene un formato inválido.' : 'Valor inválido')}
            </span>
        </div>
    );

    if (!parametrics) return <div className="p-8 text-center text-gray-500">Cargando formulario...</div>;

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto text-gray-800">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/employees" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft size={24} className="text-gray-500" />
                </Link>
                <h1 className="text-2xl font-bold">{title}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Sección 1: Datos Personales */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <h2 className="text-lg font-semibold border-b pb-4 mb-6">Datos Personales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {renderInput('employeeKey', 'Legajo', 'text', true, { pattern: '\\d{1,6}', maxLength: 6, title: 'Hasta 6 dígitos numéricos' })}
                        {renderInput('fileNumber', 'Nro Carpeta', 'text', false, { pattern: '\\d{1,3}', maxLength: 3, title: 'Hasta 3 dígitos numéricos' })}
                        {renderInput('firstName', 'Nombres', 'text', true, { maxLength: 50 })}
                        {renderInput('lastName', 'Apellido', 'text', true, { maxLength: 50 })}
                        {renderInput('dni', 'DNI', 'text', false, { pattern: '\\d{7,8}', maxLength: 8, title: 'Debe contener entre 7 y 8 dígitos numéricos sin puntos' })}
                        {renderInput('cuit', 'CUIT', 'text', false, { pattern: '\\d{11}', maxLength: 11, title: 'Debe contener 11 dígitos numéricos sin guiones' })}
                        {renderSelect('genderId', 'Sexo', parametrics.genders)}
                        {renderInput('birthDate', 'Fecha Nacimiento', 'date')}
                        {renderSelect('maritalStatusId', 'Estado Civil', parametrics.maritalStatuses)}
                        {renderInput('childrenCount', 'Cant. Hijos', 'number', false, { min: 0, max: 99 })}
                    </div>
                </div>

                {/* Sección 2: Contacto */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <h2 className="text-lg font-semibold border-b pb-4 mb-6">Datos de Contacto</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {renderInput('address', 'Domicilio', 'text', false, { maxLength: 100 })}
                        {renderInput('email', 'Email', 'email', false, { maxLength: 50 })}
                        {renderInput('phone', 'Teléfono', 'tel', false, { pattern: '\\d{10,15}', title: 'Ingrese un número válido incluyendo código de área sin 0 ni 15' })}
                    </div>
                </div>

                {/* Sección 3: Laborales */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <h2 className="text-lg font-semibold border-b pb-4 mb-6">Datos Laborales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {renderInput('entryDate', 'Fecha Ingreso', 'date')}
                        {renderSelect('jurisdictionId', 'Jurisdicción', parametrics.jurisdictions)}
                        {renderSelect('orgUnitId', 'Unidad de Organización', parametrics.orgUnits)}
                        {renderSelect('categoryId', 'Categoría', parametrics.categories)}
                        {renderSelect('groupingId', 'Agrupamiento', parametrics.groupings)}
                        {renderSelect('plantType1Id', 'Planta 1', parametrics.plantType1s)}
                        {renderSelect('plantType2Id', 'Planta 2', parametrics.plantType2s)}
                        {renderInput('workplaceLocation', 'Lugar de prestación (Texto)', 'text')}
                        <div className="flex items-center gap-2 pt-8">
                            <input type="checkbox" name="isActive" id="isActive" checked={formData.isActive} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                            <label htmlFor="isActive" className="font-medium">Empleado Activo</label>
                        </div>
                    </div>
                </div>

                {/* Sección 4: Función */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <h2 className="text-lg font-semibold border-b pb-4 mb-6">Datos de Función</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {renderInput('functionNumber', 'Número de Función', 'text', false, { pattern: '\\d{1,4}', maxLength: 4, title: 'Hasta 4 dígitos numéricos' })}
                        {renderInput('functionDescription', 'Descripción Función', 'text', false, { maxLength: 100 })}
                        {renderSelect('functionAreaId', 'Área Función', parametrics.functionAreas)}
                        {renderInput('designationDevice', 'Dispositivo Designación', 'text', false, { maxLength: 100 })}
                        {renderSelect('workplaceId', 'Lugar de prestación (Lista)', parametrics.workplaces)}
                        {renderInput('lastRecategorizationDate', 'Últ. Recategorización', 'date')}
                    </div>
                </div>

                {/* Sección 5: Legales y Jubilación */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <h2 className="text-lg font-semibold border-b pb-4 mb-6">Sumario y Jubilación</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="flex items-center gap-2 pt-8">
                            <input type="checkbox" name="hasSummary" id="hasSummary" checked={formData.hasSummary} onChange={handleChange} className="w-5 h-5 text-red-600 rounded" />
                            <label htmlFor="hasSummary" className="font-medium text-red-700">Tiene Sumario</label>
                        </div>
                        {renderInput('summaryStartDate', 'Fecha Inicio Sumario', 'date')}
                        {renderInput('summaryFileNumber', 'Expediente Sumario', 'text', false, { pattern: '\\d{4}-\\d{4}\\/\\d{4}', title: 'Formato requerido: xxxx-xxxx/aaaa' })}

                        {renderSelect('retirementStatusId', 'Estado Jubilación', parametrics.retirementStatuses)}
                        {renderInput('retirementFileNumber', 'Expediente Jubilación', 'text', false, { pattern: '\\d{4}-\\d{4}\\/\\d{4}', title: 'Formato requerido: xxxx-xxxx/aaaa' })}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pb-12">
                    <Link href="/admin/employees" className="px-6 py-3 rounded-xl text-gray-700 bg-white shadow-sm border border-gray-200 font-medium hover:bg-gray-50 transition">
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 font-medium disabled:opacity-50"
                    >
                        <Save size={20} />
                        {loading ? 'Guardando...' : 'Guardar Empleado'}
                    </button>
                </div>
            </form>
        </div>
    );
}
