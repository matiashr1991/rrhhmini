'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Lock, User } from 'lucide-react';
import EcologiaLogo from '@/components/EcologiaLogo';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { username, password });
            localStorage.setItem('token', response.data.access_token);
            const user = response.data.user;
            if (user?.role === 'EMPLOYEE') {
                router.push('/portal/dashboard');
            } else {
                router.push('/admin/dashboard');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #2C4A38 0%, #3E6C51 40%, #5A9270 70%, #A3CCBA 100%)',
            }}
        >
            {/* Decorative floating petals */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-20 h-20 bg-lapacho-500/10 rounded-full blur-2xl animate-pulse" />
                <div className="absolute top-1/4 right-20 w-32 h-32 bg-lapacho-400/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-10 right-10 w-16 h-16 bg-lapacho-300/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>

            <div className="bg-white/95 backdrop-blur-xl p-10 rounded-3xl shadow-2xl shadow-eco-900/20 border border-white/50 w-full max-w-md relative z-10">
                {/* Logo + header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <EcologiaLogo size={72} />
                    </div>
                    <h1 className="text-xl font-bold text-eco-800 tracking-tight">
                        ECOLOGÍA MISIONES
                    </h1>
                    <p className="text-eco-500 text-sm mt-1 font-medium">Sistema de Recursos Humanos</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-eco-800">Usuario</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-eco-400" size={18} />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-eco-200 text-eco-900 bg-eco-50/50 focus:outline-none focus:ring-2 focus:ring-eco-500/30 focus:border-eco-500 transition placeholder:text-eco-300"
                                placeholder="Ingresá tu usuario"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-eco-800">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-eco-400" size={18} />
                            <input
                                type="password"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-eco-200 text-eco-900 bg-eco-50/50 focus:outline-none focus:ring-2 focus:ring-eco-500/30 focus:border-eco-500 transition placeholder:text-eco-300"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full text-white py-3 rounded-xl font-semibold shadow-lg shadow-eco-700/25 disabled:opacity-50 transition-all duration-200 hover:shadow-xl hover:shadow-eco-700/30 active:scale-[0.98] cursor-pointer"
                        style={{
                            background: 'linear-gradient(135deg, #3E6C51 0%, #4A7D5E 100%)',
                        }}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Ingresando...
                            </span>
                        ) : 'Ingresar'}
                    </button>
                </form>

                <p className="text-center text-xs text-eco-400 mt-6">
                    Ministerio de Ecología — Provincia de Misiones
                </p>
            </div>
        </div>
    );
}
