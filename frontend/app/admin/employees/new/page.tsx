'use client';

import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import EmployeeForm from '../_components/EmployeeForm';

export default function NewEmployeePage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        await api.post('/employees', data);
        router.push('/admin/employees');
    };

    return <EmployeeForm title="Nuevo Empleado" onSubmit={handleSubmit} />;
}
