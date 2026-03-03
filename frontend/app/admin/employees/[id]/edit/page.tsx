'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import EmployeeForm from '../../_components/EmployeeForm';

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const response = await api.get(`/employees/${id}`);
                const emp = response.data;
                // Flatten relations for form
                setEmployee({
                    ...emp,
                    categoryId: emp.category?.id,
                    jurisdictionId: emp.jurisdiction?.id,
                });
            } catch (error) {
                console.error('Error fetching employee:', error);
                alert('No se pudo cargar el empleado');
                router.push('/admin/employees');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchEmployee();
    }, [id, router]);

    const handleSubmit = async (data: any) => {
        await api.put(`/employees/${id}`, data);
        router.push('/admin/employees');
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando...</div>;
    if (!employee) return null;

    return <EmployeeForm title="Editar Empleado" initialData={employee} onSubmit={handleSubmit} isEdit={true} />;
}
