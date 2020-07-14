import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { RoundService } from './round.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/role.decorator';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(AuthGuard('jwt'),RolesGuard)
@Controller('round')
export class RoundController {
    constructor(private readonly roundService: RoundService) { }

    @Roles('admin')
    @Post()
    addRound(@Body() payload) {
        return this.roundService.addRound(payload)
    }

    @Roles('admin')
    @Post(':round_id/open')
    openRound(@Param('round_id') round_id){
        return this.roundService.manageRoune(round_id,true)
    }

    @Roles('admin')
    @Post(':round_id/close')
    closeRound(@Param('round_id') round_id){
        return this.roundService.manageRoune(round_id,false)
    }

    @Roles('admin','user')
    @Get()
    getRound() {
        return this.roundService.getRound()
    }

    @Roles('admin','user')
    @Get(':round_id')
    getRoundById(@Param("round_id") id: string) {
        return this.roundService.getRoundById(id)
    }
}
