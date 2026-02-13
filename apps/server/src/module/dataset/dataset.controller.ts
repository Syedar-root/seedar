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
import { UpdateDatasetDto } from './dto/update-dataset.dto';

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
  update(@Param('id') id: string, @Body() updateDatasetDto: UpdateDatasetDto) {
    return this.datasetService.update(+id, updateDatasetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.datasetService.remove(+id);
  }
}
