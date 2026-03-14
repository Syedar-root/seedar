import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './services/dashboard.service';
import { PanelService } from './services/panel.service';
import { DashboardController } from './dashboard.controller';
import { PanelController } from './panel.controller';
import { Dashboard } from './entities/dashboard.entity';
import { DashboardPanel } from './entities/dashboard-panel.entity';
import { DashboardPanelRelation } from './entities/dashboard-panel-relation.entity';
import { QueryModule } from '../query/query.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Dashboard,
      DashboardPanel,
      DashboardPanelRelation,
    ]),
    QueryModule,
  ],
  controllers: [DashboardController, PanelController],
  providers: [DashboardService, PanelService],
  exports: [DashboardService, PanelService],
})
export class DashboardModule {}
