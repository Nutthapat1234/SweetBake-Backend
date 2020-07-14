import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CartService } from '../cart/cart.service';
import * as admin from 'firebase-admin'
import { RoundService } from '../round/round.service';

@Injectable()
export class CheckoutService {
    private readonly db = admin.database()
    private readonly stroage = admin.storage().bucket()
    constructor(private readonly cartService: CartService,
        private readonly roundService: RoundService) { }

    async toCheckOutQueue(id: string) {
        try {
            let message = ""
            let error = false
            let cart = await this.cartService.getCartByUserId(id)
            if (Object.keys(cart).length == 0)
                throw new HttpException("Cart is empty", 403)
            if (cart['items'].length != 0) {
                let order_id = Math.random().toString(36).substr(2, 9)
                for (var item of cart['items']) {
                    let round_id = item['round']['round_id']
                    let roundRef = this.db.ref(`round/${round_id}`)
                    await roundRef.transaction((data) => {
                        if (data == null)
                            return data
                        for (let order of item['orders']) {
                            let remain = data['menus'].filter(element => { return element['menu_id'] == order['menu_id'] })[0]['remaining']
                            if (order['quantity'] > remain) {
                                error = true
                                message += `${order['name']} not enough (remain: ${remain})\n`
                            }
                        }
                        if (error) {
                            return data
                        }
                        else {
                            let sub_id = Math.random().toString(36).substr(2, 9)
                            let payload = []
                            for (let order of item['orders']) {
                                let menu_obj = data['menus'].filter(element => { return element['menu_id'] == order['menu_id'] })[0]
                                menu_obj['remaining'] -= order['quantity']
                                payload.push(order)
                            }
                            this.db.ref(`checkout/toVerify/${order_id}/${sub_id}`).set({
                                round: { round_id: round_id, name: data['name'] },
                                items: payload, boxes: item["boxes"], note: item['note'], address: item['address'],
                                shipping_cost: item["shippingCost"]
                            })
                            return data
                        }
                    })

                }
                if (error)
                    throw new HttpException(message, HttpStatus.NOT_ACCEPTABLE)
                else {
                    let userRef = this.db.ref(`checkout/user/${id}/toVerify`)
                    userRef.once('value', function (data) {
                        let payload = JSON.parse(JSON.stringify(data.val()))
                        if (payload == null) {
                            userRef.set([order_id])
                            return
                        }
                        payload.push(order_id)
                        userRef.set(payload)
                    })
                    this.db.ref(`cart/${id}`).set(null)
                    this.db.ref(`checkout/toVerify/${order_id}`).update({ user_id: id, amount: cart['amount'], boxes_price: cart['boxes_price'] })
                    return {
                        statusCode: 200,
                        message: "Success add to checkout Queue",
                        order_id: order_id
                    }
                }
            }
        } catch (e) {
            throw new HttpException(e.response, e.status)
        }

    }

    async uploadTransferSlip(id, order_id, image) {
        try {
            let data = await this.db.ref(`checkout/user/${id}/toVerify`).once('value')
            let orderList = data.val()
            if (orderList == null)
                throw new HttpException("No Checkout for this user", HttpStatus.BAD_REQUEST)
            else if (!orderList.includes(order_id))
                throw new HttpException("Forbiden to upload for this order", HttpStatus.FORBIDDEN)

            if (image) {
                this.stroage.file(`${order_id}/${image[0]['originalname']}`).save(image[0]['buffer'])
                return {
                    statusCode: 200,
                    message: "Success adding money transfer slip waitting for apporve"
                }
            }
            throw new HttpException("No image upload", HttpStatus.NOT_ACCEPTABLE)

        } catch (e) {
            throw new HttpException(e.response, e.status)
        }
    }

    async approve(order_id: string) {
        try {
            let error = false
            let orderRef = this.db.ref(`checkout/toVerify/${order_id}`)
            await orderRef.once('value', data => {
                let order_info = data.val()
                if (order_info == null) {
                    error = true
                    return
                }
                this.db.ref(`checkout/verified/${order_id}`).set(order_info)
                this.updateUsertoVerifyList(order_info["user_id"], order_id)
                this.updateUserVerifiedList(order_info["user_id"], order_id)

                let { amount, user_id, ...onlyRound } = order_info
                for (let [key, value] of Object.entries(onlyRound))
                    this.updateAdminList(value["round"]["round_id"], `${order_id}/${key}`)
                orderRef.set(null)
            })
            if (error)
                throw new HttpException(`No Order for id ${order_id}`, HttpStatus.BAD_REQUEST)
            return {
                statusCode: 200,
                message: `Success approve for order id ${order_id}`
            }
        } catch (e) {
            throw new HttpException(e.response, e.status)
        }

    }

    updateUsertoVerifyList(id, order_id) {
        let verifiedRef = this.db.ref(`checkout/user/${id}/toVerify`)
        verifiedRef.once('value', data => {
            let list = data.val()
            if (list == null) {
                verifiedRef.set([order_id])
                return
            }
            let remainOrder = list.filter(element => { return element != order_id })
            verifiedRef.set(remainOrder)
        })
    }

    updateUserVerifiedList(id, order_id) {
        let verifiedRef = this.db.ref(`checkout/user/${id}/verified`)
        verifiedRef.once('value', data => {
            let list = data.val()
            if (list == null) {
                verifiedRef.set([order_id])
                return
            }
            list.push(order_id)
            verifiedRef.set(list)
        })
    }

    updateAdminList(round_id, order_id) {
        let adminRef = this.db.ref(`checkout/admin/${round_id}`)
        adminRef.once('value', data => {
            let list = data.val()
            if (list == null) {
                adminRef.set([order_id])
                return
            }
            list.push(order_id)
            adminRef.set(list)
        })
    }

    updateUserRejectList(id, order_id) {
        let rejectRef = this.db.ref(`checkout/user/${id}/reject`)
        rejectRef.once('value', data => {
            let list = data.val()
            if (list == null) {
                rejectRef.set([order_id])
                return
            }
            list.push(order_id)
            rejectRef.set(list)
        })
    }

    async reject(order_id) {
        try {
            let orders = await this.db.ref(`checkout/toVerify/${order_id}`).once('value')
            if (orders.val() == null)
                throw new HttpException(`No Order with id ${order_id}`,HttpStatus.BAD_REQUEST)
            let { amount, user_id, boxes_price, ...onlyOrder } = orders.val()
            for (let order of Object.values(onlyOrder))
                this.refundItem(order)
            this.db.ref(`checkout/reject/${order_id}`).set(orders.val())
            this.db.ref(`checkout/toVerify/${order_id}`).set(null)
            this.updateUsertoVerifyList(user_id, order_id)
            this.updateUserRejectList(user_id, order_id)
            return {
                statusCode: 200,
                message: `Success reject order ${order_id}`
            }
        } catch (e) {
            throw new HttpException(e.response, e.status)
        }
    }

    async rejectForUser(id, order_id) {
        try {
            let orders = await this.db.ref(`checkout/toVerify/${order_id}`).once('value')
            if (orders.val() == null)
                throw new HttpException(`No Order with id ${order_id}`,HttpStatus.BAD_REQUEST)
            let { amount, user_id, boxes_price, ...onlyOrder } = orders.val()
            if( user_id != id)
                throw new HttpException("Forbidden",HttpStatus.FORBIDDEN)
            for (let order of Object.values(onlyOrder))
                this.refundItem(order)
            this.db.ref(`checkout/reject/${order_id}`).set(orders.val())
            this.db.ref(`checkout/toVerify/${order_id}`).set(null)
            this.updateUsertoVerifyList(user_id, order_id)
            this.updateUserRejectList(user_id, order_id)
            return {
                statusCode: 200,
                message: `Success reject order ${order_id}`
            }
        } catch (e) {
            throw new HttpException(e.response, e.status)
        }
    }

    refundItem(order) {
        let roundRef = this.db.ref(`round/${order['round']['round_id']}`)
        roundRef.transaction(data => {
            if (data == null)
                return data
            for (let item of Object.values(order["items"])) {
                let selected = data["menus"].filter(e => { return e["menu_id"] == item["menu_id"] })[0]
                selected["remaining"] += item['quantity']
            }
            return data
        })
    }

    getOrdersforAdmin(verified = false) {
        let path = 'checkout/toVerify'
        if (verified)
            path = 'checkout/verified/'
        return this.db.ref(path).once('value').then(
            data => {
                if (data.val() == null)
                    return { orders: [] }
                return { orders: [...Object.keys(data.val())] }
            }
        )
    }

    async getOrderById(order_id, sub_id = null, verified = false,) {
        let path = `checkout/toVerify/${order_id}`
        if (verified) {
            if (sub_id != null)
                path = `checkout/verified/${order_id}/${sub_id}`
            else
                path = `checkout/verified/${order_id}`
        }
        else {
            const [file] = await this.stroage.getFiles({ prefix: order_id })
            var url
            if (file.length != 0)
                url = await file[0].getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 1 })
            else
                url = "No Image"
        }

        return this.db.ref(path).once('value').then(
            data => {
                let result = data.val()
                if (result == null)
                    return {}
                result['bill'] = url
                return result
            }
        )
    }

    getRejectforAdmin() {
        let rejectRef = this.db.ref(`checkout/reject`)
        return rejectRef.once('value').then(data => {
            return { orders: [...Object.keys(data.val())] }
        })
    }

    getRejectByOrderId(order_id) {
        let rejectRef = this.db.ref(`checkout/reject/${order_id}`)
        return rejectRef.once('value').then(data => {
            if (data.val() == null)
                return {}
            return data.val()
        })
    }

    getRoundForAdmin() {
        let adminRef = this.db.ref(`checkout/admin`)
        return adminRef.once('value').then(
            async data => {
                let result = { rounds: [] }
                for (let [key, value] of Object.entries(data.val())) {
                    let name = (await this.roundService.getRoundById(key))["name"]
                    result['rounds'].push({ round_id: key, name: name })
                }
                return result
            }
        )
    }

    getRoundforAdminByRoundId(round_id) {
        let orderRef = this.db.ref(`checkout/admin/${round_id}`)
        return orderRef.once('value').then(
            async data => {
                let orders = data.val()
                let payload = {}
                let name = null
                let orderValue = []
                for (let keys of JSON.parse(JSON.stringify(orders))) {
                    let key = keys.split('/')
                    let aboutOrder = await this.getOrderById(key[0], null, true)
                    let item = await this.getOrderById(key[0], key[1], true)
                    item['user_id'] = aboutOrder['user_id']
                    item['address'] = aboutOrder['address']
                    item['note'] = aboutOrder['note']
                    if (name == null)
                        name = item['round']['name']
                    let { round, ...withoutRound } = item
                    orderValue.push(withoutRound)
                }
                payload[round_id] = { name: name, orders: orderValue }
                return payload
            })
    }

    // for User
    getToVerifyforUser(id) {
        let userRef = this.db.ref(`checkout/user/${id}/toVerify`)
        return userRef.once('value').then(data => {
            let order = data.val()
            if (data.val() == null)
                order = []
            return { orders: order }
        })
    }

    getVerifiedforUser(id) {
        let userRef = this.db.ref(`checkout/user/${id}/verified`)
        return userRef.once('value').then(data => {
            return { orders: data.val() }
        })
    }

    getRejectforUser(id) {
        let rejectRef = this.db.ref(`checkout/user/${id}/reject`)
        return rejectRef.once('value').then(data => {
            return { orders: [...Object.values(data.val())] }
        })
    }

    async getOrderforUserByOrderId(id, order_id, verified = false) {
        var order
        if (verified)
            order = await this.getOrderById(order_id, null, true)
        else
            order = await this.getOrderById(order_id)
        if (order['user_id'] == id)
            return order
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
    }

    async getRejectforUserByOrderId(id, order_id) {
        let order = await this.getRejectByOrderId(order_id)
        if (order['user_id'] == id)
            return order
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
    }

}
