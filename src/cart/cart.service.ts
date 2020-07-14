import { Injectable, HttpException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { RoundService } from '../round/round.service';

@Injectable()
export class CartService {
    private readonly db = admin.database()
    constructor(private readonly roundService: RoundService) { }

    addToCart(id: string, payload) {
        try {
            for (let [round_id, value] of Object.entries(payload)) {
                for (let [menu_id, quantity] of Object.entries(value)) {
                    if (quantity == 0) {
                        this.db.ref(`cart/${id}/${round_id}/${menu_id}`).set(null)
                        continue
                    }
                    this.db.ref(`cart/${id}/${round_id}/${menu_id}`).set(quantity)
                }
            }
            return {
                message: 'success modify product in cart',
                statusCode: 200
            }
        } catch (e) {
            throw new HttpException(e, 500)
        }
    }

    getCartByUserId(id: string): any {
        let cartRef = this.db.ref(`cart/${id}`)
        return cartRef.once('value').then(
            async data => {
                var result = data.val()
                if (result) {
                    let response = { items: [] }
                    let box_price = 0
                    let amount = 0
                    for (let [roundId, value] of Object.entries(result)) {
                        let round = await this.roundService.getRoundById(roundId)
                        let selectMenus = await round['menus'].filter((menu) => {
                            return Object.keys(value).includes(menu["menu_id"])
                        })
                        let modify_menu = []
                        for (let menu of selectMenus) {
                            let temp = Object.assign(menu)
                            temp['quantity'] = value[menu["menu_id"]]
                            temp['total'] = this.computePrice(menu['quantity'], menu['price'])
                            amount += temp['total']
                            let { price, ...withoutprice } = temp
                            modify_menu.push(withoutprice)
                        }
                        let boxes = this.computeBox(modify_menu)
                        if (Object.keys(boxes).length > 1)
                            box_price += (Object.keys(boxes).length - 1) * 5
                        let { menus, ...withoutmenus } = round
                        amount += value['shippingCost']
                        response['items'].push({ round: withoutmenus, orders: modify_menu, boxes: boxes, 
                            shippingCost: value['shippingCost'], note: value["note"],address:value["address"] })
                    }
                    response['boxes_price'] = box_price
                    response['amount'] = amount + box_price
                    return response
                }
                return {}
            }
        )
    }

    computePrice(quantity, priceObj) {
        let total = 0
        let quantitySet = []
        for (let temp of Object.keys(priceObj))
            quantitySet.push(parseInt(temp.match(/\d+/g)[0]))
        quantitySet.sort(function (a, b) { return b - a })
        while (quantity >= 1) {
            for (let divide of quantitySet) {
                if (quantity < divide)
                    continue
                else {
                    total += priceObj[`${divide}psc`]
                    quantity -= divide
                    break
                }
            }
        }
        return total
    }

    // no dynamic method: specific for this store
    computeBox(items) {
        const remainingRatio = {
            3: 2,
            2: 4,
            1: 4,
        }
        let boxes = {}
        var browines, cup, cs = null
        for (let value of Object.values(items)) {
            if (value["name"] == "Nutella Brownies")
                browines = value
            else if (value["name"] == "Nutella Cup")
                cup = value
            else
                cs = value
        }
        let num = 1
        let remaing = false
        if (browines) {
            let quantity = browines["quantity"]
            while (quantity > 0) {
                if (quantity >= 8) {
                    boxes[`box_${num}`] = [`8b`]
                    quantity -= 8
                    num += 1
                    continue
                }
                else if (quantity >= 4)
                    boxes[`box_${num}`] = [`4b`]
                else {
                    boxes[`box_${num}`] = [`${quantity}b`]
                    remaing = true
                    var reBox = num
                    var re = quantity
                }
                quantity -= 4
                num += 1
            }
        }
        if (cup) {
            let quantity = cup["quantity"]
            while (quantity > 0) {
                if (quantity >= 12) {
                    boxes[`box_${num}`] = [`8b`]
                    quantity -= 8
                    num += 1
                    continue
                }
                if (quantity >= 6)
                    boxes[`box_${num}`] = [`6c`]
                else
                    if (remaing)
                        if (quantity <= remainingRatio[re]) {
                            boxes[`box_${reBox}`].push(`${quantity}c`)
                            break
                        }
                boxes[`box_${num}`] = [`${quantity}c`]
                quantity -= 6
                num += 1
            }
        }
        if (cs) {
            for (let i = 0; i < cs["quantity"]; i++) {
                boxes[`box_${num}`] = [`1c`]
                num += 1
            }
        }
        return boxes
    }
}
