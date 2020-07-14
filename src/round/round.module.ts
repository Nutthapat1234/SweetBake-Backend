import { Module } from '@nestjs/common';
import { RoundService } from './round.service';
import { RoundController } from './round.controller';
import { MenusModule } from '../menus/menus.module';
import { MenusService } from '../menus/menus.service';

@Module({
  imports: [MenusModule],
  providers: [RoundService],
  controllers: [RoundController],
  exports: [RoundService]
})
export class RoundModule {}
