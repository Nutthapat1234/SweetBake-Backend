import { Injectable, HttpException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import e from 'express';
import { info } from 'console';

@Injectable()
export class MenusService {
    private readonly db = admin.database()
    private readonly stroage = admin.storage().bucket()

    addMenu(information) {
        try {
            var uid = Math.random().toString(36).substr(2, 9)
            this.db.ref(`menus/${uid}`).set(information)
            return {
                statusCode: 200,
                message: "Success adding new Menu"
            }
        }
        catch (e) {
            console.log(e)
            throw new HttpException(e, 500)
        }

    }

    getMenus() {
        var menuRef = this.db.ref('menus')
        return menuRef.once('value').then(
            async data => {
                var result = data.val()
                return result
            })
    }

    getMenuById(id: string) {
        var menuRef = this.db.ref(`menus/${id}`)
        return menuRef.once('value').then(
            async data => {
                var result = data.val()
                result['menu_id'] = id
                return result
            })
    }
}
