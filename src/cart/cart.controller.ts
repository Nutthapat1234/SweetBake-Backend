import { Controller, Post, Body, Get, UseGuards, Request} from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/role.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('cart')
@UseGuards(AuthGuard('jwt'),RolesGuard)
export class CartController {

    constructor(private readonly cartService: CartService) { }

    @Roles('user')
    @Post()
    modifyCart(@Body() payload,@Request() req){
        return this.cartService.addToCart(req.user["user_id"],payload)
    }

    @Roles('user')
    @Get()
    getCartByUserId(@Request() req){
        return this.cartService.getCartByUserId(req.user["user_id"])
    }
}
