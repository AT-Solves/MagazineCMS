import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.userRepo.findOne({ where: { email: body.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role, orgId: user.orgId });
    return {
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, orgId: user.orgId, childSafetyClearance: user.childSafetyClearance },
    };
  }

  @Get('verify')
  async verify(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return {
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, orgId: user.orgId, childSafetyClearance: user.childSafetyClearance },
      };
    } catch {
      throw new UnauthorizedException();
    }
  }
}
