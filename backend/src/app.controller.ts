import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) {}

  /* ==============================
     1️⃣ 기본 헬스 체크
  ============================== */
  @Get()
  getRoot() {
    return {
      ok: true,
      message: 'Backend is running',
    };
  }

  /* ==============================
     2️⃣ 서버 상태 확인용
  ============================== */
  @Get('health')
  getHealth() {
    return {
      ok: true,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
