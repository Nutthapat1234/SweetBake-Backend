import { Injectable } from '@nestjs/common';


@Injectable()
export class AppService {
  home(): string {
    return "Welcome to Line Liff Project API"
  }
}