import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersRepository.findOne({ where: { username } });
        if (user && (await bcrypt.compare(pass, user.passwordHash))) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        // user object here comes from validateUser return, which is the User entity minus password
        // We need to ensure we have the employee relation or id if we want to return it.
        // validateUser currently finds by username. We should ensure it loads the employee relation if we use it.

        // Let's reload the user with relation to be sure, or update validateUser.
        // For efficiency, let's just make sure validateUser (or similar) returns what we need.
        // But validateUser returns `result` which is `user` without password.
        // If we change validateUser to load relations, it will affect other things.

        // Let's fetch the user with employee here to be safe and clean.
        const fullUser = await this.usersRepository.findOne({
            where: { id: user.id },
            relations: ['employee']
        });

        if (!fullUser) return null;

        const payload = {
            username: fullUser.username,
            sub: fullUser.id,
            role: fullUser.role,
            employeeId: fullUser.employee?.id
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                username: fullUser.username,
                role: fullUser.role,
                id: fullUser.id,
                employeeId: fullUser.employee?.id
            }
        };
    }

    async register(username: string, pass: string, role: any) {
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(pass, salt);
        const user = this.usersRepository.create({
            username,
            passwordHash,
            role,
        });
        return this.usersRepository.save(user);
    }

    async registerForEmployee(username: string, pass: string, role: any, employeeId: string) {
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(pass, salt);
        const user = this.usersRepository.create({
            username,
            passwordHash,
            role,
            employee: { id: employeeId } as any,
        });
        return this.usersRepository.save(user);
    }

    async getUsers() {
        return this.usersRepository.find({
            select: { id: true, username: true, role: true, createdAt: true },
            relations: ['employee'],
        });
    }

    async deleteUser(id: string) {
        return this.usersRepository.delete(id);
    }

    async updateUser(id: string, data: { role: string; password?: string }) {
        if (data.password) {
            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash(data.password, salt);
            await this.usersRepository.update(id, { role: data.role as any, passwordHash });
        } else {
            await this.usersRepository.update(id, { role: data.role as any });
        }
        return this.usersRepository.findOne({ where: { id }, relations: ['employee'] });
    }
}
