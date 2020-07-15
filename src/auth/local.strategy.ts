
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as request from "request-promise";



@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'user_id',
      passwordField: 'access_token'
    });
  }

  async validate(user_id: string, access_token: string): Promise<any> {
    let payload
    if (user_id == process.env.admin_user && access_token == process.env.admin_password)
      payload = { user_id: "admin", roles: 'admin' }
    else {
      const json = await request.get({
        url: `https://api.line.me/oauth2/v2.1/verify?access_token=${access_token}`,
        json: true
      })
      if (json.client_id != process.env.channel_id)
        throw new UnauthorizedException
      payload = {
        user_id: user_id,
        roles: 'user'
      }
    }
    return payload
  }
}