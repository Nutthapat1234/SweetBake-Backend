import { Controller, Get, Param, Post, UseGuards, Request} from '@nestjs/common';
import { UsersService } from './users.service';
import { CheckoutService } from '../checkout/checkout.service';
import { RolesGuard } from '../auth/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/role.decorator';

@UseGuards(AuthGuard('jwt'),RolesGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService,
                private readonly checkoutService: CheckoutService) { }

        @Roles("user")
        @Post('reject/:order_id')
        reject(@Param('order_id') order_id){
            return this.checkoutService.rejectForUser('ns1k1d',order_id)
        }

        @Roles("user")
        @Get('reject/orders')
        getRejectforUser(){
            return this.checkoutService.getRejectforUser('ns1k1d')
        }
    
        @Roles("user")
        @Get('reject/orders/:order_id')
        getRejectforUserByOrderId(@Param('order_id') order_id,@Request() req){
            return this.checkoutService.getRejectforUserByOrderId(req.user["user_id"],order_id)
        }
    
        @Roles("user")
        @Get('toVerify/orders')
        getToVerifyforUser(@Request() req){
            return this.checkoutService.getToVerifyforUser(req.user["user_id"])
        }
    
        @Roles("user")
        @Get('toVerify/:order_id')
        getToVerifyforUserByOrderId(@Param('order_id') order_id,@Request() req){
            return this.checkoutService.getOrderforUserByOrderId(req.user["user_id"],order_id)
        }
    
        @Roles("user")
        @Get('verified/orders')
        getVerifyforUser(@Request() req){
            return this.checkoutService.getVerifiedforUser(req.user["user_id"])
        }
    
        @Roles("user")
        @Get('verified/orders/:order_id')
        getVerifyforUserByOrderId(@Param('order_id') order_id,@Request() req){
            return this.checkoutService.getOrderforUserByOrderId(req.user["user_id"],order_id,true)
        }

}
