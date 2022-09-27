import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateUserDto, LoginDto } from './dto';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private jwt: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try {
      createUserDto.password = await argon.hash(createUserDto.password);
      const user = await this.prisma.user.create({ data: createUserDto });
      delete user.password;
      return { user, access_token: await this.signToken(user.id, user.email) };
    } catch (error) {
      console.log(error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email already exists');
        }
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
    });
    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }
    const pwMatches = await argon.verify(user.password, loginDto.password);
    if (!pwMatches) {
      throw new ForbiddenException('Invalid credentials');
    }
    delete user.password;
    const token = await this.signToken(user.id, user.email);
    return {
      message: 'Login successful',
      result: { user, access_token: token.access_token },
    };
  }

  async signToken(
    userId: string,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });
    return {
      access_token: token,
    };
  }
}
