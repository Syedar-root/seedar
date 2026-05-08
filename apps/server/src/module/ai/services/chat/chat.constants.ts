export const CHAT_CONTEXT_POLICY_DEFAULTS = {
  contextWindowTokens: 64_000,
  softRatio: 0.72,
  hardRatio: 0.85,
  keepRecentSegments: 12,
} as const;

export const CHAT_CORE_TOOL_NAMES = [
  'askQuestion',
  'getCurrentTime',
  'toolMarket',
  'toolMarketExecutor',
] as const;

export const CHAT_WORKFLOW_TOOL_NAMES = [
  'workflowMarket',
  'startWorkflow',
] as const;

export const CHAT_BLACKLIST_TOOL_NAMES: RegExp[] = [/askQuestion/, /startWorkflow/, /extract/];

export const CHAT_DEMAND_TOOL_MAP = {
  'data-query': ['getDataAtTemp', 'getDatasetInfo', 'getDatasourceInfo'],
  'chart-recommend': [
    'askQuestion',
    'getCurrentTime',
    'workflowMarket',
    'startWorkflow',
  ],
  'convert-to-backend': [],
} as const;

export const CHAT_DEMAND_SKILL_MAP = {
  'data-query': ['data-query'],
  'chart-recommend': ['chart-recommend', 'vchart-development-assistant'],
  'convert-to-backend': [],
} as const;
