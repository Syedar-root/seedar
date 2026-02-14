import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DatasetService } from './services/dataset.service';
import { CreateDatasetRequest } from './dto/create-dataset.request';
import { UpdateDatasetRequest } from './dto/update-dataset.req';

@Controller('dataset')
export class DatasetController {
  constructor(private readonly datasetService: DatasetService) {}

  @Post()
  create(@Body() createDatasetDto: CreateDatasetRequest) {
    return this.datasetService.create(createDatasetDto);
  }

  @Get()
  findAll() {
    return this.datasetService.findAllWithDetails();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.datasetService.findOne(+id);
  }

  @Patch(':id')
  update(@Body() updateDatasetRequest: UpdateDatasetRequest) {
    return this.datasetService.update(updateDatasetRequest);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.datasetService.remove(+id);
  }
}
