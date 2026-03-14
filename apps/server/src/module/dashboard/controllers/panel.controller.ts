import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PanelService } from '../services/panel.service';
import { CreatePanelRequest } from '../dto/create-panel.request';
import { UpdatePanelRequest } from '../dto/update-panel.request';

@Controller('panel')
export class PanelController {
  constructor(private readonly panelService: PanelService) {}

  @Post()
  create(@Body() createPanelRequest: CreatePanelRequest) {
    return this.panelService.create(createPanelRequest);
  }

  @Get()
  findAll() {
    return this.panelService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.panelService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePanelRequest: UpdatePanelRequest,
  ) {
    return this.panelService.update(id, updatePanelRequest);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.panelService.remove(id);
  }
}
