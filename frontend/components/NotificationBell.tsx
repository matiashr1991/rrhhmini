'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import api from '@/lib/api';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    referenceId?: string;
}

export default function NotificationBell({ target }: { target: 'admin' | 'employee' }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await api.get(`/notifications/unread?target=${target}`);
            setNotifications(res.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchNotifications();

        // Setup polling every 30 seconds
        const intervalId = setInterval(fetchNotifications, 30000);
        return () => clearInterval(intervalId);
    }, [target]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.patch(`/notifications/read-all?target=${target}`);
            setNotifications([]);
            setIsOpen(false);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-AR', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit'
        }).format(date);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-blue-600 transition focus:outline-none"
            >
                <Bell size={24} />
                {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full px-1 border-2 border-white animate-pulse">
                        {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="font-semibold px-1 text-gray-800 flex items-center gap-2">
                            Notificaciones
                            {notifications.length > 0 && (
                                <span className="bg-blue-100 text-blue-700 text-xs py-0.5 px-2 rounded-full font-bold">
                                    {notifications.length} nuevas
                                </span>
                            )}
                        </h3>
                        {notifications.length > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded transition hover:bg-blue-50"
                            >
                                Marcar todo leído
                            </button>
                        )}
                    </div>

                    <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                                <Bell className="text-gray-300 mb-2" size={32} />
                                <p className="text-sm">No tienes notificaciones nuevas</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className="p-4 hover:bg-blue-50/30 transition group flex flex-col gap-1 cursor-default relative"
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <span className="font-semibold text-sm text-gray-800 leading-tight pr-6">
                                                {notification.title}
                                            </span>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap pt-0.5 font-medium shrink-0">
                                                {formatDate(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-snug mt-1">
                                            {notification.message}
                                        </p>

                                        <button
                                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                                            className="absolute top-4 right-4 p-1 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                                            title="Marcar como leída"
                                        >
                                            <Check size={16} strokeWidth={3} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
