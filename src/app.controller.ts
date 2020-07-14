import { Controller, Get, UseGuards, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly authService: AuthService) { }

  @Get()
  home() {
    return this.appService.home()
  }

  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  login(@Req() req) {
    return this.authService.login(req.user)
  }
}