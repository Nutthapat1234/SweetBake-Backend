import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MenusModule } from '../menus/menus.module';
import { RoundModule } from '../round/round.module';

@Module({
    imports: [RoundModule],
    providers: [CartService],
    controllers: [CartController],
    exports: [CartService]
})
export class CartModule {}
