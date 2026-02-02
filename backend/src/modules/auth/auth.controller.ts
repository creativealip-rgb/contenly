import {
  Controller,
  Post,
  Body,
  Get,
  Headers as HttpHeaders,
  Res,
  Req,
  All,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { auth } from '../../auth/auth.config';
import { toNodeHandler } from 'better-auth/node';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Handle all Better Auth routes (OAuth, callbacks, etc.)

  @Post('register')
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.signUp({
      email: dto.email,
      password: dto.password,
      name: dto.fullName,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.signIn({
      email: dto.email,
      password: dto.password,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  async logout(@HttpHeaders('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.signOut(token);
  }

  @Get('session')
  @ApiOperation({ summary: 'Get current session' })
  async getSession(@Req() req: Request) {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      }
    }
    return this.authService.getSession({ headers });
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  // Handle all Better Auth routes (OAuth, callbacks, etc.)
  @All('*')
  async handleBetterAuth(@Req() req: Request, @Res() res: Response) {
    console.log(`🔵 Better Auth: ${req.method} ${req.url}`);
    console.log(`📍 Origin: ${req.headers.origin}`);
    console.log(`📍 X-Forwarded-Proto: ${req.headers['x-forwarded-proto']}`);
    console.log(`📍 All Headers:`, JSON.stringify(req.headers));

    // Fix for multiple proxies (Vercel -> Ngrok) causing "https, https" in protocol
    if (req.headers['x-forwarded-proto']) {
      const proto = req.headers['x-forwarded-proto'];
      if (Array.isArray(proto)) {
        req.headers['x-forwarded-proto'] = proto[0];
      } else if (typeof proto === 'string' && proto.includes(',')) {
        req.headers['x-forwarded-proto'] = proto.split(',')[0].trim();
      }
    }

    // Let Better Auth handle OAuth and other built-in routes
    const handler = toNodeHandler(auth);
    return handler(req, res);
  }
}
