import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InventoriesModule } from './inventories/inventories.module';
import { DiscussionModule } from './discussion/discussion.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';
import { SearchModule } from './search/search.module';
import { CustomIdModule } from './custom-id/custom-id.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    InventoriesModule,
    DiscussionModule,
    AdminModule,
    UploadModule,
    SearchModule,
    CustomIdModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
