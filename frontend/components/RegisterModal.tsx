'use client';

import { useState } from 'react';
import { X, User, Lock, Mail, CheckCircle2, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
    const [step, setStep] = useState(1);
    const [dni, setDni] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleCheckDni = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.get(`/auth/check-dni/${dni}`);
            if (response.data.success) {
                setStep(2);
            } else {
                setError(response.data.message);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al verificar el DNI.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/self-register', { dni, email, password });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al completar el registro.');
        } finally {
            setLoading(false);
        }
    };

    const resetAndClose = () => {
        setStep(1);
        setDni('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-eco-100">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-eco-700 to-eco-500 p-6 text-white relative">
                    {!success && (
                        <button 
                            onClick={resetAndClose}
                            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {success ? '¡Registro Exitoso!' : 'Registro de Empleado'}
                    </h2>
                    <p className="text-eco-100 text-sm mt-1">
                        {success 
                            ? 'Ya puedes ingresar al sistema con tu DNI.' 
                            : step === 1 
                                ? 'Paso 1: Verificaremos tu identidad con tu DNI.' 
                                : 'Paso 2: Completa tus datos de acceso.'}
                    </p>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 flex items-center gap-2 border border-red-100 animate-in slide-in-from-top-1">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {success ? (
                        <div className="text-center py-4">
                            <div className="flex justify-center mb-4">
                                <div className="bg-eco-50 p-4 rounded-full">
                                    <CheckCircle2 size={48} className="text-eco-600" />
                                </div>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión usando tu <strong>DNI como usuario</strong> y la contraseña que elegiste.
                            </p>
                            <button 
                                onClick={resetAndClose}
                                className="w-full py-3 bg-eco-600 text-white font-semibold rounded-xl hover:bg-eco-700 transition shadow-lg shadow-eco-600/20"
                            >
                                Ir al Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={step === 1 ? handleCheckDni : handleRegister} className="space-y-4">
                            {step === 1 ? (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Número de DNI</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                required
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-eco-500/20 focus:border-eco-500 outline-none transition"
                                                placeholder="Ingresa tu DNI sin puntos"
                                                value={dni}
                                                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || !dni}
                                        className="w-full py-3 bg-eco-600 text-white font-semibold rounded-xl hover:bg-eco-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verificar Legajo'}
                                        {!loading && <ChevronRight size={18} />}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Confirmation Message */}
                                    <div className="bg-eco-50 text-eco-700 p-3 rounded-xl text-xs font-medium flex items-center gap-2 border border-eco-100 mb-2">
                                        <CheckCircle2 size={14} />
                                        Se encontró tu legajo correctamente.
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Correo Electrónico</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="email"
                                                required
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-eco-500/20 focus:border-eco-500 outline-none transition"
                                                placeholder="tu@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Contraseña</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="password"
                                                required
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-eco-500/20 focus:border-eco-500 outline-none transition"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="password"
                                                required
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-eco-500/20 focus:border-eco-500 outline-none transition"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-eco-600 text-white font-semibold rounded-xl hover:bg-eco-700 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Finalizar Registro'}
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-full text-gray-400 text-sm hover:text-gray-600 transition"
                                    >
                                        Volver atrás
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
