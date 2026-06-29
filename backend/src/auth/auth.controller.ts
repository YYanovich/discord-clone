import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const fingerprint = req.headers['x-fingerprint'] as string;
    if (!fingerprint) {
      throw new UnauthorizedException('Unable to verify device identity');
    }

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

    this.setCookies(res, result.refreshToken, result.sessionId);

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
      throw new UnauthorizedException('Device fingerprint is required');

    const refreshToken = req.cookies?.refresh_token;
    const sessionId = req.cookies?.session_id;

    const result = await this.authService.refresh(
      refreshToken,
      sessionId,
      fingerprint,
    );

    this.setCookies(res, result.refreshToken, result.sessionId);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies?.session_id;
    await this.authService.logout(sessionId);
    res.clearCookie('refresh_token');
    res.clearCookie('session_id');
    return { success: true };
  }

  private setCookies(res: Response, refreshToken: string, sessionId: string) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie('refresh_token', refreshToken, cookieOptions);
    res.cookie('session_id', sessionId, cookieOptions);
  }
}
