import 'reflect-metadata';
import { BusinessException } from '@/common/exceptions';
import { ExceptionType } from '@/common/exceptions';
import { DatasetService } from '@/module/dataset/services/dataset.service';
import {
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { tool, Tool } from 'langchain';
import {
  type AskQuestionParams,
  askQuestionSchema,
  getDataAtTempSchema,
  getDatasetInfoSchema,
} from './toolSchema';
import { QueryService } from '@/module/query/query.service';
import { getDatasetInfoCompact } from './helper';
import { interrupt } from '@langchain/langgraph';
import { randomUUID } from 'crypto';
import { ToolConfig } from '../ai.types';

type ToolMethod = (
  input: Record<string, unknown>,
  runtime?: unknown,
) => Promise<unknown> | unknown;

const TOOL_METADATA_KEY = 'Seedar_Tool';

function Seedar_Tool(config: ToolConfig): MethodDecorator {
  return function (target, propertyKey, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(TOOL_METADATA_KEY, config, target, propertyKey);
  };
}

@Injectable()
export class ToolService {
  private toolMethods: Array<{ method: ToolMethod; config: ToolConfig }> = [];

  constructor(
    private readonly datasetService: DatasetService,
    private readonly queryService: QueryService,
  ) {
    this.collectTools();
  }

  private collectTools() {
    const whiteList = ['constructor', 'collectTools', 'getTools'];
    const prototype = Object.getPrototypeOf(this);
    const propertyNames = Object.getOwnPropertyNames(prototype)
      .filter((name) => !whiteList.includes(name))
      .filter((name) => {
        const metadata = Reflect.getMetadata(
          TOOL_METADATA_KEY,
          prototype,
          name,
        );
        return !!metadata;
      });

    this.toolMethods = propertyNames.map((name) => ({
      method: prototype[name].bind(this),
      config: Reflect.getMetadata(TOOL_METADATA_KEY, prototype, name),
    }));
  }

  public getTools(toolNames?: string[]): Tool[] {
    const tools = this.toolMethods.map(({ method, config }) =>
      tool(method, {
        name: config.name,
        description: config.description,
        schema: config.schema,
      }),
    );
    if (toolNames) {
      return tools.filter((tool) => toolNames.includes(tool.name));
    }
    return tools;
  }

  public getToolNames() {
    return this.toolMethods.map((tool) => tool.config.name);
  }

  public getToolConfigs() {
    return this.toolMethods.map((tool) => tool.config);
  }

  @Seedar_Tool({
    name: 'getDatasetInfo',
    description:
      '根据数据集 ID 获取数据集的表、字段、join、指标等信息及其元信息',
    schema: getDatasetInfoSchema,
  })
  public async getDatasetInfo({ datasetId }: { datasetId: string }) {
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
  }

  @Seedar_Tool({
    name: 'getDataAtTemp',
    description: '根据数据集 ID 和查询 DSL 执行临时查询，返回查询结果',
    schema: getDataAtTempSchema,
  })
  public async getDataAtTemp({ dsl }: { dsl: any }) {
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
  }

  @Seedar_Tool({
    name: 'getCurrentTime',
    description: '获取当前时间',
  })
  public getCurrentTime() {
    return new Date().toISOString();
  }

  @Seedar_Tool({
    name: 'askQuestion',
    description:
      '提问工具，向用户提问，返回问题的详细回答；常用于问题澄清，需求获取，步骤确认等场景',
    schema: askQuestionSchema,
  })
  public askQuestion({ questions }: AskQuestionParams) {
    // 校验 questions 是否为空数组
    if (Array.isArray(questions) && questions.length === 0) {
      throw new BusinessException(
        ExceptionType.AI_AGENT_TOOL_FAILED,
        '问题列表不能为空',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 当问题是选择题时，需要提供一个其他选项，用户可以补充选项
    questions.forEach((q) => {
      if (q.type === 'choice') {
        q.options?.push('[其它]');
      }
    });

    questions.push({
      question: '是否还有其他信息需要补充？',
      type: 'text',
    });

    const response = interrupt({
      questions: questions.map((q) => ({
        ...q,
        key: `${q.type}_${randomUUID()}`,
      })),
    });
    return response;
  }
}
