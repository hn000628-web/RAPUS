import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user) {
    // 실제 에러는 그대로 던진다
    if (err) {
      throw err;
    }

    // 토큰이 없으면 null
    // 토큰이 유효하면 user 반환
    return user ?? null;
  }
}
