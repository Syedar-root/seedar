import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { QueryService } from './query.service';
import { CreateQueryRequest } from './dto/create-query.request';
import { UpdateQueryRequest } from './dto/update-query.request';
import { ExecuteQueryRequest } from './dto/execute-query.request';
import { QueryStatus } from './query-status.enum';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  create(@Body() createQueryRequest: CreateQueryRequest) {
    return this.queryService.create(createQueryRequest);
  }

  @Get()
  findAll(@Query('status') status?: QueryStatus) {
    return this.queryService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queryService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQueryRequest: UpdateQueryRequest,
  ) {
    return this.queryService.update(+id, updateQueryRequest);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.queryService.remove(+id);
  }

  @Post('execute')
  execute(@Body() executeQueryRequest: ExecuteQueryRequest) {
    return this.queryService.execute(executeQueryRequest.queryId);
  }
}
