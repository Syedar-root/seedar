import 'reflect-metadata';
import { BusinessException, ExceptionType } from '@/common/exceptions';
import { DatasetService } from '@/module/dataset/services/dataset.service';
import { QueryService } from '@/module/query/query.service';
import { HttpStatus, Injectable } from '@nestjs/common';
import { type ToolRunnableConfig } from '@langchain/core/tools';
import { interrupt } from '@langchain/langgraph';
import { tool, Tool } from 'langchain';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import {
  FRONTEND_WORKFLOW_TEMPLATES,
  getFrontendWorkflowTemplate,
  type AskUserInterrupt,
  type StartWorkflowRequest,
  type WorkflowRunInterrupt,
} from '@seedar/types';
import { ToolConfig } from '../ai.types';
import { getDatasetInfoCompact } from './helper';
import {
  askQuestionSchema,
  getDataAtTempSchema,
  getDatasetInfoSchema,
  startWorkflowSchema,
  toolMarketExecutorSchema,
  type AskQuestionParams,
  type StartWorkflowParams,
  type ToolMarketExecutorParams,
} from './toolSchema';

type ToolMethod = (
  input: Record<string, unknown>,
  runtime?: unknown,
) => Promise<unknown> | unknown;

const TOOL_METADATA_KEY = 'Seedar_Tool';

function Seedar_Tool(config: ToolConfig): MethodDecorator {
  return function (target, propertyKey) {
    Reflect.defineMetadata(TOOL_METADATA_KEY, config, target, propertyKey);
  };
}

@Injectable()
export class ToolService {
  private toolMethods: Array<{ method: ToolMethod; config: ToolConfig }> = [];
  private readonly TOOL_EXECUTOR_BLOCKLIST = [
    'askQuestion',
    'startWorkflow',
    'workflowMarket',
  ];

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
      return tools.filter((item) => toolNames.includes(item.name));
    }

    return tools;
  }

  public getToolNames() {
    return this.toolMethods.map((item) => item.config.name);
  }

  public getToolConfigs() {
    return this.toolMethods.map((item) => item.config);
  }

  @Seedar_Tool({
    name: 'getDatasetInfo',
    description: '根据数据集 ID 获取表、字段、关联与指标等元信息',
    schema: getDatasetInfoSchema,
  })
  public async getDatasetInfo({ datasetId }: { datasetId: string }) {
    const id = Number(datasetId);

    if (Number.isNaN(id)) {
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
    description: '根据查询 DSL 执行临时查询并返回结果',
    schema: getDataAtTempSchema,
  })
  public async getDataAtTemp({ dsl }: { dsl: any }) {
    const datasetId = Number(dsl.datasetId);

    if (Number.isNaN(datasetId)) {
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
    description: '向用户提问，用于澄清需求、补充信息或确认步骤',
    schema: askQuestionSchema,
  })
  public askQuestion({ questions }: AskQuestionParams) {
    if (Array.isArray(questions) && questions.length === 0) {
      throw new BusinessException(
        ExceptionType.AI_AGENT_TOOL_FAILED,
        '问题列表不能为空',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    questions.forEach((question) => {
      if (question.type !== 'choice') {
        return;
      }

      const otherOptions = question.options?.filter((option) => option.isOther);
      if (otherOptions && otherOptions.length > 1) {
        question.options = question.options?.filter((option) => !option.isOther);
        question.options?.push(otherOptions[0]);
        return;
      }

      if (!otherOptions || otherOptions.length === 0) {
        question.options?.push({
          label: '其他',
          value: '其他',
          isOther: true,
        });
      }
    });

    questions.push({
      question: '是否还有其他信息需要补充？',
      type: 'text',
    });

    const response: AskUserInterrupt = {
      kind: 'ask_user',
      questions: questions.map((question) => ({
        ...question,
        id: `${question.type}_${randomUUID()}`,
      })),
    };

    return interrupt(response);
  }

  @Seedar_Tool({
    name: 'workflowMarket',
    description: '返回当前可用的 workflow 模板列表',
  })
  public workflowMarket() {
    return {
      workflows: FRONTEND_WORKFLOW_TEMPLATES.map(
        ({ paramsSchema, actions, ...template }) => ({
          ...template,
          paramsSchema: paramsSchema
            ? z.toJSONSchema(paramsSchema)
            : undefined,
        }),
      ),
    };
  }

  @Seedar_Tool({
    name: 'startWorkflow',
    description: '启动一个预定义 workflow 模板，并携带对应参数',
    schema: startWorkflowSchema,
  })
  public startWorkflow({ workflowId, params }: StartWorkflowParams) {
    const workflow = getFrontendWorkflowTemplate(workflowId);

    if (!workflow) {
      throw new BusinessException(
        ExceptionType.AI_AGENT_TOOL_FAILED,
        `workflow ${workflowId} 不存在`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const parsedParams = workflow.paramsSchema
      ? workflow.paramsSchema.safeParse(params ?? {})
      : {
          success: true as const,
          data: params,
        };

    if (!parsedParams.success) {
      throw new BusinessException(
        ExceptionType.AI_AGENT_TOOL_FAILED,
        `workflow ${workflowId} 参数校验失败：${parsedParams.error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const request: StartWorkflowRequest = {
      workflowId,
      params: parsedParams.data,
    };
    const payload: WorkflowRunInterrupt = {
      kind: 'workflow_run',
      interruptId: randomUUID(),
      request,
    };

    return interrupt(payload);
  }

  @Seedar_Tool({
    name: 'toolMarket',
    description: '返回当前可用工具列表',
  })
  public toolMarket() {
    return {
      toolInfoList: this.getToolConfigs().filter(
        (item) => !['toolMarket', 'workflowMarket', 'startWorkflow'].includes(item.name),
      ),
    };
  }

  @Seedar_Tool({
    name: 'toolMarketExecutor',
    description: '根据工具名执行工具，需配合 toolMarket 使用',
    schema: toolMarketExecutorSchema,
  })
  public async toolMarketExecutor(
    { toolName, toolParams }: ToolMarketExecutorParams,
    runtime?: ToolRunnableConfig,
  ) {
    if (this.TOOL_EXECUTOR_BLOCKLIST.includes(toolName)) {
      return `不能使用中断工具 ${toolName}`;
    }

    const targetTool = this.getTools([toolName])[0];
    if (!targetTool) {
      return `工具 ${toolName} 不存在`;
    }

    try {
      const parsedParams =
        typeof toolParams === 'string' ? JSON.parse(toolParams) : toolParams;
      return await targetTool.invoke(parsedParams, runtime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `工具 ${toolName} 执行失败：${message}`;
    }
  }
}
