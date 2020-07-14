import { Controller, Post, UseInterceptors,UploadedFiles, Param,Get, UseGuards, Request } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/role.decorator';


UseGuards(AuthGuard('jwt'),RolesGuard)
@Controller('checkout')
export class CheckoutController {
    constructor(private readonly checkOutService: CheckoutService) { }

    @Roles('user')
    @Post()
    toCheckOut(@Request() req){
        return this.checkOutService.toCheckOutQueue(req.user["user_id"])
    }

    @Roles('user')
    @Post('upload/orders/:order_id')
    @UseInterceptors(AnyFilesInterceptor())
    UploadSlip(@Param('order_id') order_id, @UploadedFiles() image,@Request() req) {
        return this.checkOutService.uploadTransferSlip(req.user["user_id"],order_id,image)
    }

    @Roles('admin')
    @Post('approve/orders/:order_id')
    approve(@Param('order_id') order_id ){
        return this.checkOutService.approve(order_id)
    }

    @Roles('admin')
    @Post('reject/orders/:order_id')
    reject(@Param('order_id') order_id ){
        return this.checkOutService.reject(order_id)
    }

    //for admin
    @Roles('admin')
    @Get('admin/verified/round')
    getRoundforAdmin(){
        return this.checkOutService.getRoundForAdmin()
    }

    @Roles('admin')
    @Get('admin/verified/round/:round_id')
    getRoundforAdminByRoundId(@Param('round_id') round_id){
        return this.checkOutService.getRoundforAdminByRoundId(round_id)
    }

    @Roles('admin')
    @Get('admin/reject/orders')
    getRejectforAdmin(){
        return this.checkOutService.getRejectforAdmin()
    }

    @Roles('admin')
    @Get('admin/reject/orders/:order_id')
    getRejectforAdminById(@Param('order_id') order_id){
        return this.checkOutService.getRejectByOrderId(order_id)
    }

    @Roles('admin')
    @Get('admin/toVerify/orders')
    getToVerify(){
        return this.checkOutService.getOrdersforAdmin()
    }

    @Roles('admin')
    @Get('admin/toVerify/orders/:order_id')
    getToVerifyById(@Param('order_id') order_id){
        return this.checkOutService.getOrderById(order_id)
    }
}
