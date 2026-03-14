import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { DashboardService } from './services/dashboard.service';
import { CreateDashboardRequest } from './dto/create-dashboard.request';
import { UpdateDashboardRequest } from './dto/update-dashboard.request';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post()
  create(@Body() createDashboardRequest: CreateDashboardRequest) {
    return this.dashboardService.create(createDashboardRequest);
  }

  @Get()
  findAll() {
    return this.dashboardService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dashboardService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDashboardRequest: UpdateDashboardRequest,
  ) {
    return this.dashboardService.update(id, updateDashboardRequest);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dashboardService.remove(id);
  }

  @Put(':id/layout')
  updateLayout(@Param('id') id: string, @Body() layout: Record<string, any>) {
    return this.dashboardService.updateLayout(id, layout);
  }

  @Post(':id/panels')
  addPanel(@Param('id') id: string, @Body('panelId') panelId: string) {
    return this.dashboardService.addPanel(id, panelId);
  }

  @Delete(':id/panels/:panelId')
  removePanel(@Param('id') id: string, @Param('panelId') panelId: string) {
    return this.dashboardService.removePanel(id, panelId);
  }
}
