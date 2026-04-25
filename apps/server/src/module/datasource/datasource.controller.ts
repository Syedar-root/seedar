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
import { DatasourceService } from './service/datasource.service';
import { CreateDatasourceRequest } from './dto/create-datasource.request';
import { UpdateDatasourceRequest } from './dto/update-datasource.request';
import { DatasourceResponse } from './dto/datasource.response';
import { TestDatasourceConnectionRequest } from './dto/test-datasource-connection.request';
import { TestDatasourceConnectionResponse } from './dto/test-datasource-connection.response';
import { SuccessMessage } from '@/common/success-message.decorator';

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

  @Post('test-connection')
  @SuccessMessage('数据源连接测试完成')
  testConnection(
    @Body() testDatasourceConnectionRequest: TestDatasourceConnectionRequest,
  ): Promise<TestDatasourceConnectionResponse> {
    return this.datasourceService.testConnection(testDatasourceConnectionRequest);
  }

  @Get()
  @SuccessMessage('数据源列表查询成功')
  findAll(): Promise<DatasourceResponse[]> {
    return this.datasourceService.findAll();
  }

  @Get(':id')
  @SuccessMessage('数据源查询成功')
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
