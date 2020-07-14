import { Injectable, HttpException, Inject, HttpStatus } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { MenusService } from '../menus/menus.service';

@Injectable()
export class RoundService {
    private readonly db = admin.database()
    constructor(private readonly menuService: MenusService) { }

    addRound(info) {
        try {
            var uid = Math.random().toString(36).substr(2, 9)
            info['menus'] = {
                "0": { "menu_id": process.env.browines_id, "remaining": process.env.browines_limit },
                "1": { "menu_id": process.env.cup_id, "remaining": process.env.cup_limit },
                "2": { "menu_id": process.env.combo_id, "remaining": process.env.combo_limit }
            }
            info["active"] = true
            this.db.ref(`round/${uid}`).set(info)
            return {
                statusCode: 200,
                message: "Success adding new Round",
                round_id: uid
            }
        } catch (e) {
            throw new HttpException(e, 500)
        }

    }

    manageRoune(round_id,value) {
        try {
            this.db.ref(`round/${round_id}`).update({ active: value })
            return {
                statusCode: 200,
                message: `Success to set active status of round ${round_id} to ${value}`
            }
        } catch (e) {
            throw new HttpException(e,HttpStatus.INTERNAL_SERVER_ERROR)
        }

    }

    getRound() {
        var roundRef = this.db.ref('round')
        return roundRef.once('value').then(
            async data => {
                let result = []
                for (let [key, value] of Object.entries(data.val())) {
                    if (!value['active'])
                        continue
                    result.push({ round_id: key, name: value["name"] })
                }
                return { rounds: result }
            }
        )
    }

    getRoundById(round_id: string) {
        var roundRef = this.db.ref(`round/${round_id}`)
        return roundRef.once('value').then(
            async data => {
                var result = data.val()
                result['round_id'] = round_id
                let menu_detail = await this.getMenus(result['menus'])
                for (let value of Object.values(menu_detail))
                    value['remaining'] = result['menus'].filter(e => { return e.menu_id == value.menu_id })[0]['remaining']
                result['menus'] = menu_detail
                return result
            }
        )
    }

    async getMenus(menus) {
        let details = []
        for (let value of menus) {
            if (value)
                details.push(await this.menuService.getMenuById(value['menu_id']))
        }
        return details
    }
}
