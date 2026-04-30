const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const getChartWorkflowSpec = (
  params: unknown,
): Record<string, unknown> | undefined => {
  if (!isRecord(params)) {
    return undefined;
  }

  if (
    isRecord(params.set_advanced_spec) &&
    isRecord(params.set_advanced_spec.spec)
  ) {
    return params.set_advanced_spec.spec;
  }

  if (isRecord(params.advancedSpec)) {
    return params.advancedSpec;
  }

  if (isRecord(params.spec)) {
    return params.spec;
  }

  if (isRecord(params.chartSpec)) {
    return params.chartSpec;
  }

  return undefined;
};

const buildStartWorkflowGuardMessage = (
  workflowId: string,
  params: unknown,
): string | null => {
  if (workflowId !== 'query_current_panel_as_chart_v1') {
    return null;
  }

  if (!isRecord(params)) {
    return null;
  }

  const chartSpec = getChartWorkflowSpec(params);
  if (chartSpec && Object.prototype.hasOwnProperty.call(chartSpec, 'data')) {
    return [
      `workflow ${workflowId} 只接受 spec，不要在 spec 中传 data。`,
      '当前面板数据会由前端自动注入。',
      '请改为只保留图表配置结构，以及 spec 中对当前 DSL 已有字段的映射。',
    ].join('');
  }

  if (Object.prototype.hasOwnProperty.call(params, 'data')) {
    return [
      `workflow ${workflowId} 不接受 data 参数。`,
      '当前面板数据会由前端自动注入。',
      '请只传 spec，不要重新查数，也不要内联查询结果。',
    ].join('');
  }

  const queryStateKeys = [
    'datasetId',
    'dimensions',
    'metrics',
    'filters',
    'tempMetrics',
    'orderBy',
    'topN',
    'queryState',
    'set_query_state',
  ];

  const invalidQueryKeys = queryStateKeys.filter((key) =>
    Object.prototype.hasOwnProperty.call(params, key),
  );

  if (invalidQueryKeys.length > 0) {
    return [
      `workflow ${workflowId} 不接受查询参数：${invalidQueryKeys.join(', ')}。`,
      '这个流程不会修改当前 panel 的 DSL。',
      '请只传 spec，并让 spec 中的字段引用当前 DSL 已有字段。',
    ].join('');
  }

  return null;
};

export { buildStartWorkflowGuardMessage };
