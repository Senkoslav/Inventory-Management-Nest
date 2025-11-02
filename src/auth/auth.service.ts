import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateOAuthUser(profile: any): Promise<User> {
    const { provider, providerId, email, name, avatarUrl } = profile;

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
          socialIds: { [provider]: providerId },
          roles: [UserRole.USER],
        },
      });
    } else {
      const socialIds = (user.socialIds as any) || {};
      if (!socialIds[provider]) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            socialIds: { ...socialIds, [provider]: providerId },
          },
        });
      }
    }

    return user;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        roles: user.roles,
      },
    };
  }

  async validateUser(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
