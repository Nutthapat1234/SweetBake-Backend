import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config'
import { UsersModule } from './users/users.module';
import { MenusModule } from './menus/menus.module';
import { RoundModule } from './round/round.module';
import { CartModule } from './cart/cart.module';
import { AuthModule } from './auth/auth.module';
import { CheckoutModule } from './checkout/checkout.module';


@Module({
  imports: [ConfigModule.forRoot({
    envFilePath: '.env',
    isGlobal: true
  }), UsersModule, MenusModule, CartModule, RoundModule, AuthModule, CheckoutModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
