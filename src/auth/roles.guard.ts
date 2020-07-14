
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    // const isPublic = this.reflector.get<boolean>( "isPublic", context.getHandler() );
    // if(isPublic){
    //   return true
    // }
    const expect_role =  this.reflector.get<string[]>('roles', context.getHandler());
    const request = context.switchToHttp().getRequest();
    const payload = request.user;
    return this.matchRoles(expect_role, payload.roles)
  }

  private matchRoles(expect_role: String[], roles: Array<String>): boolean {
    let result = false;
    if (expect_role == undefined)
      return true
    expect_role.forEach(role => {
      if (roles.includes(role)){
        result = true;
        return
      }
    })
    return result;
  }
}
