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
  toolMarketExecutorSchema,
  type ToolMarketExecutorParams,
} from './toolSchema';
import { QueryService } from '@/module/query/query.service';
import { getDatasetInfoCompact } from './helper';
import { interrupt } from '@langchain/langgraph';
import { randomUUID } from 'crypto';
import { ToolConfig } from '../ai.types';
import { is, tr } from 'zod/v4/locales';
import { type ToolRunnableConfig } from '@langchain/core/tools';

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
  private INTERRUPT_TOOL_NAMES = ['askQuestion'];

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
        // 检查是否有且只有一个其他选项
        const otherOptions = q.options?.filter((o) => o.isOther);
        if (otherOptions && otherOptions?.length > 1) {
          // 移除只保留第一个其他选项
          q.options = q.options?.filter((o) => !o.isOther);
          q.options?.push(otherOptions[0]);
        } else if (!otherOptions || otherOptions?.length === 0) {
          // 如果没有其他选项，添加一个默认的其他选项
          q.options?.push({ label: '其它', value: '其它', isOther: true });
        }
      }
    });

    questions.push({
      question: '是否还有其他信息需要补充？',
      type: 'text',
    });

    const response = interrupt({
      questions: questions.map((q) => ({
        ...q,
        id: `${q.type}_${randomUUID()}`,
      })),
    });
    return response;
  }

  @Seedar_Tool({
    name: 'toolMarket',
    description:
      '工具市场，返回所有可用的工具。如果你没有直接可使用的工具，你可以使用这个工具来获取可用的工具列表。搭配 toolMarketExecutor 工具使用',
  })
  public toolMarket() {
    return {
      toolInfoList: this.getToolConfigs().filter(
        (tool) => tool.name !== 'toolMarket',
      ),
    };
  }

  // 工具市场执行器
  @Seedar_Tool({
    name: 'toolMarketExecutor',
    description:
      '工具市场执行器，根据用户输入的工具名称，执行对应的工具。搭配 toolMarket 工具使用',
    schema: toolMarketExecutorSchema,
  })
  public async toolMarketExecutor(
    { toolName, toolParams }: ToolMarketExecutorParams,
    runtime?: ToolRunnableConfig,
  ) {
    if (this.INTERRUPT_TOOL_NAMES.includes(toolName)) {
      return `不能使用中断工具 ${toolName}`;
    }
    const tool = this.getTools([toolName])[0];
    if (!tool) {
      return `工具 ${toolName} 不存在`;
    }
    try {
      // 如果 toolParams 是字符串，则解析为对象
      const parsedParams =
        typeof toolParams === 'string' ? JSON.parse(toolParams) : toolParams;
      return await tool.invoke(parsedParams, runtime);
    } catch (error) {
      return `工具 ${toolName} 执行失败：${error.message}`;
    }
  }
}
