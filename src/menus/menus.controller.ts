import { Controller, Post, Body, UseInterceptors, UploadedFiles, Get, Res, Param, UseGuards } from '@nestjs/common';
import { MenusService } from './menus.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/role.decorator';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(AuthGuard('jwt'),RolesGuard)
@Controller('menus')
export class MenusController {
    constructor(private readonly menuService: MenusService) { }

    @Roles('admin')
    @Post()
    addMenu(@Body() payload) {
        return this.menuService.addMenu(payload)
    }

    @Roles('admin','user')
    @Get()
    getMenu() {
        return this.menuService.getMenus()
    }

    @Roles('admin','user')
    @Get(':menu_id')
    getMenuById(@Param('menu_id') id: string) {
        return this.menuService.getMenuById(id)
    }
}
