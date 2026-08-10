import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { RateLimit } from '../common/decorators/rate-limit.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //3 attempts for registration
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'register', limit: 3, ttl: 60 })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  //10 attempts got login(protect from brute force)
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'login', limit: 10, ttl: 60 })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const fingerprint = req.headers['x-fingerprint'] as string;
    if (!fingerprint)
      throw new UnauthorizedException('Device fingerprint required');

    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.authService.login(
      dto,
      fingerprint,
      ipAddress,
      userAgent,
    );

    res.cookie('session_id', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const fingerprint = req.headers['x-fingerprint'] as string;
    if (!fingerprint)
      throw new UnauthorizedException('Device fingerprint required');

    const sessionId = req.cookies?.session_id;
    if (!sessionId) throw new UnauthorizedException('Session not found');

    const result = await this.authService.refresh(sessionId, fingerprint);

    res.cookie('session_id', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies?.session_id;
    if (sessionId) await this.authService.logout(sessionId);
    res.clearCookie('session_id');
    return { success: true };
  }
}
