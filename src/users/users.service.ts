import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Role } from 'src/auth/types/auth-user.type';
import { Role as PrismaRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateRole(params: { userId: number; role: Role }) {
    const { userId, role } = params;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) throw new BadRequestException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role,
        hashedRefreshToken: null, // ключевое: выкидываем со всех устройств
        tokenVersion: { increment: 1 },
      },
      select: { id: true, email: true, role: true },
    });

    return { before: user, after: updated };
  }

  getVerificationRequests() {
    return this.prisma.user.findMany({
      where: { role: PrismaRole.NEED_VERIFICATION },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        university: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reviewVerificationRequest(params: {
    userId: number;
    action: 'approve' | 'reject';
  }) {
    const { userId, action } = params;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) throw new BadRequestException('User not found');
    if (user.role === PrismaRole.ADMIN) {
      throw new ForbiddenException('Cannot process admin user');
    }
    if (user.role !== PrismaRole.NEED_VERIFICATION) {
      throw new BadRequestException('User does not require verification');
    }

    const nextRole =
      action === 'approve'
        ? PrismaRole.UNIVERSITY
        : PrismaRole.NEED_VERIFICATION;

    if (user.role === nextRole) {
      return { before: user, after: user };
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: nextRole,
        hashedRefreshToken: null,
        tokenVersion: { increment: 1 },
      },
      select: { id: true, email: true, role: true },
    });

    return { before: user, after: updated };
  }

  async attachDiplomaToStudent(diplomaId: string, userId: number) {
    const student = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!student) throw new BadRequestException('Student not found');
    if (student.role !== PrismaRole.STUDENT) {
      throw new BadRequestException('Only student can attach diploma');
    }

    const diploma = await this.prisma.diploma.findUnique({
      where: { id: diplomaId },
      select: { id: true, userId: true },
    });
    if (!diploma) throw new BadRequestException('Diploma not found');

    return this.prisma.diploma.update({
      where: { id: diplomaId },
      data: { userId: student.id },
      select: {
        id: true,
        userId: true,
        universityId: true,
        status: true,
      },
    });
  }
}
