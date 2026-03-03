import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationsRepository: Repository<Notification>,
    ) { }

    // Get notifications for a specific user (employee) or global (admins)
    async getUnread(userId?: string): Promise<Notification[]> {
        if (userId) {
            return this.notificationsRepository.find({
                where: { userId: userId, isRead: false },
                order: { createdAt: 'DESC' },
                take: 20
            });
        }

        // Admins see all global ones + maybe some others, but let's keep it simple: global (null userId)
        return this.notificationsRepository.find({
            where: { userId: IsNull(), isRead: false },
            order: { createdAt: 'DESC' },
            take: 20
        });
    }

    async markAsRead(id: string): Promise<void> {
        await this.notificationsRepository.update(id, { isRead: true });
    }

    async markAllAsRead(userId?: string): Promise<void> {
        if (userId) {
            await this.notificationsRepository.update({ userId: userId, isRead: false }, { isRead: true });
        } else {
            await this.notificationsRepository.update({ userId: IsNull(), isRead: false }, { isRead: true });
        }
    }

    // Internal helper to create notifications from other services
    async createNotification(data: {
        userId?: string | null;
        title: string;
        message: string;
        type: string;
        referenceId?: string;
    }): Promise<Notification> {
        const notification = this.notificationsRepository.create({
            userId: data.userId || null, // null means global admin alert
            title: data.title,
            message: data.message,
            type: data.type,
            referenceId: data.referenceId
        });
        return this.notificationsRepository.save(notification);
    }
}
