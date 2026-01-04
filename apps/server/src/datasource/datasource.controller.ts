import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
} from '@nestjs/common';
import { DatasourceService } from './datasource.service';
import { CreateDatasourceRequest } from './dto/create-datasource.request';
import { UpdateDatasourceRequest } from './dto/update-datasource.request';
import { DatasourceResponse } from './dto/datasource.response';

@Controller('datasource')
export class DatasourceController {
  @Inject(DatasourceService)
  private readonly datasourceService!: DatasourceService;

  @Post()
  create(
    @Body() createDatasourceRequest: CreateDatasourceRequest,
  ): Promise<DatasourceResponse> {
    return this.datasourceService.create(createDatasourceRequest);
  }

  @Get()
  findAll(): Promise<DatasourceResponse[]> {
    return this.datasourceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<DatasourceResponse> {
    return this.datasourceService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDatasourceRequest: UpdateDatasourceRequest,
  ): Promise<DatasourceResponse> {
    return this.datasourceService.update(+id, updateDatasourceRequest);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.datasourceService.remove(+id);
  }
}
