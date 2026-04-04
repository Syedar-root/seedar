import { BusinessException } from '@/common/exceptions';
import { ExceptionType } from '@/common/exceptions';
import { DatasetService } from '@/module/dataset/services/dataset.service';
import {
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { tool } from 'langchain';
import { getDataAtTempSchema, getDatasetInfoSchema } from './toolSchema';
import { QueryService } from '@/module/query/query.service';
import { getDatasetInfoCompact } from './helper';

@Injectable()
export class ToolService {
  constructor(
    private readonly datasetService: DatasetService,
    private readonly queryService: QueryService,
  ) {}

  public getTools() {
    return [this.getDatasetInfo, this.getDataAtTemp, this.getCurrentTime];
  }

  /**
   * 查询数据集信息工具
   * @memberof ToolService
   */
  public getDatasetInfo = tool(
    async ({ datasetId }) => {
      const id = Number(datasetId);

      if (isNaN(id)) {
        throw new BusinessException(
          ExceptionType.AI_AGENT_TOOL_FAILED,
          '数据集 ID 无效',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const dataset = await this.datasetService.findOne(id);
      return getDatasetInfoCompact(dataset);
    },
    {
      name: 'getDatasetInfo',
      description:
        '根据数据集 ID 获取数据集的表、字段、join、指标等信息及其元信息',
      schema: getDatasetInfoSchema,
    },
  );

  /**
   * 执行临时查询工具
   * @memberof ToolService
   */
  public getDataAtTemp = tool(
    async ({ dsl }) => {
      const datasetId = Number(dsl.datasetId);

      if (isNaN(datasetId)) {
        throw new BusinessException(
          ExceptionType.AI_AGENT_TOOL_FAILED,
          '数据集 ID 无效',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const result = await this.queryService.executeTemp({ ...dsl, datasetId });
      return result.results;
    },
    {
      name: 'getDataAtTemp',
      description: '根据数据集 ID 和查询 DSL 执行临时查询，返回查询结果',
      schema: getDataAtTempSchema,
    },
  );

  /**
   * 获取当前时间工具
   * @memberof ToolService
   */
  public getCurrentTime = tool(() => new Date().toISOString(), {
    name: 'getCurrentTime',
    description: '获取当前时间',
  });
}
