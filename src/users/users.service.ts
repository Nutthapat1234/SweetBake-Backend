import { Injectable, HttpException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
    private readonly db = admin.database()
}
