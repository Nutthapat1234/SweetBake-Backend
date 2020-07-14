import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as admin from 'firebase-admin'

async function bootstrap() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        clientEmail: process.env.client_email,
        privateKey: process.env.private_key.replace(/\\n/g, '\n'),
        projectId: process.env.project_id,
      }),
      databaseURL: process.env.database_url,
      storageBucket: process.env.storage_bucket
    })
  }
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
