import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatasourceModule } from './datasource/datasource.module';

@Module({
  imports: [DatasourceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
