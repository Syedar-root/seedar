import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dashboard } from './entities/dashboard.entity';
// import { QueryModule } from '../query/query.module';
import { Panel } from './entities/panel.entity';
import { QueryModule } from '../query/query.module';
import { Query } from '../query/entities/query.entity';
import { DashboardPanelRelation } from './entities/dashboard-panel-relation.entity';
import { DashboardController } from './controllers/dashboard.controller';
import { PanelController } from './controllers/panel.controller';
import { DashboardService } from './services/dashboard.service';
import { PanelService } from './services/panel.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Dashboard,
      Panel,
      DashboardPanelRelation,
      Query,
    ]),
    QueryModule,
  ],
  controllers: [DashboardController, PanelController],
  providers: [DashboardService, PanelService],
  exports: [DashboardService, PanelService],
})
export class DashboardModule {}
