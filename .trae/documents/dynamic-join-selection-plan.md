# 动态Join选择实现计划

## 问题分析

### 当前问题
1. **DSL包含joins字段**：前端传入的DSL包含joins数组，指定了要使用的join关系
2. **依赖DSL.joins构建查询**：`dsl-transformer.v2.ts`和`dsl-transformer.ts`中根据`dsl.joins`来构建join部分
3. **不合理的设计**：前端不应该知道具体的join关系，这应该由后端根据dataset配置和查询需求动态计算

### 影响范围
- `apps/server/src/module/query/dsl-transformer/dsl-transformer.v2.ts` - V2版本转换器
- `apps/server/src/module/query/dsl-transformer/dsl-transformer.ts` - V1版本转换器
- `apps/server/src/module/query/dto/execute-temp-query.request.ts` - 使用QueryDSL类型
- `apps/server/src/module/query/dto/create-query.request.ts` - 使用QueryDSL类型
- `apps/server/src/module/query/entities/query.entity.ts` - 可能存储DSL JSON

## 实现方案

### 核心思路
1. **移除DSL中的joins字段** - 前端不再指定joins
2. **自动收集依赖表** - 从dimensions、metrics、filters中收集所有依赖的表
3. **动态计算join路径** - 根据dataset中的joins配置，计算从主表到所有依赖表的最短路径
4. **生成join顺序** - 确保join的正确顺序

### 技术实现

#### 1. 依赖表收集
```typescript
// 收集所有需要的表ID
const requiredTableIds = new Set<number>();
requiredTableIds.add(dsl.tableId); // 主表

// 在resolveField时自动添加字段所属表
const resolveField = (fieldId: number) => {
  const fieldInfo = fieldMap.get(fieldId);
  requiredTableIds.add(fieldInfo.tableId);
  // ...
}

// 在构建metrics后，递归收集指标依赖的表
const collectTableDependencies = (expr: Expr) => {
  if (expr instanceof FieldRefExpr) {
    // 从tableAlias反向查找tableId
  }
  // 递归处理子表达式
}
```

#### 2. Join图构建
```typescript
// 构建无向图：tableId -> Set<{joinId, targetTableId}>
const buildJoinGraph = (): Map<number, Set<{joinId: number, targetTableId: number}>> => {
  const graph = new Map();
  
  joinMap.forEach((join, joinId) => {
    // 双向连接
    if (!graph.has(join.leftTableId)) {
      graph.set(join.leftTableId, new Set());
    }
    graph.get(join.leftTableId).add({joinId, targetTableId: join.rightTableId});
    
    if (!graph.has(join.rightTableId)) {
      graph.set(join.rightTableId, new Set());
    }
    graph.get(join.rightTableId).add({joinId, targetTableId: join.leftTableId});
  });
  
  return graph;
}
```

#### 3. BFS查找Join路径
```typescript
// 从主表出发，找到所有依赖表的join路径
const findJoinPath = (
  startTableId: number,
  targetTableIds: Set<number>
): number[] => {
  const joinGraph = buildJoinGraph();
  const visited = new Set<number>();
  const requiredJoins = new Set<number>();
  
  // BFS遍历
  const queue = [{tableId: startTableId, path: []}];
  
  while (queue.length > 0) {
    const {tableId, path} = queue.shift();
    
    if (visited.has(tableId)) continue;
    visited.add(tableId);
    
    // 如果是目标表，记录路径上的所有join
    if (targetTableIds.has(tableId)) {
      path.forEach(joinId => requiredJoins.add(joinId));
    }
    
    // 遍历邻居节点
    const neighbors = joinGraph.get(tableId) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.targetTableId)) {
        queue.push({
          tableId: neighbor.targetTableId,
          path: [...path, neighbor.joinId]
        });
      }
    }
  }
  
  return Array.from(requiredJoins);
}
```

#### 4. 动态生成Joins
```typescript
// 根据找到的join路径生成join列表
const requiredJoinIds = findJoinPath(dsl.tableId, requiredTableIds);
const joins: JoinSpec[] = [];
let joinAliasIdx = 2;

for (const joinId of requiredJoinIds) {
  const joinInfo = joinMap.get(joinId);
  // 构建JoinSpec对象
  // 分配表别名
  // 添加到joins数组
}
```

## 实施步骤

### Phase 1: 修改DSL接口定义
- [ ] 修改`dsl-transformer.v2.ts`中的`QueryDSL`接口，移除`joins`字段
- [ ] 修改`dsl-transformer.ts`中的`QueryDSL`接口，移除`joins`字段
- [ ] 检查并更新所有使用`QueryDSL`的地方

### Phase 2: 实现动态Join选择逻辑（V2版本）
- [ ] 添加`requiredTableIds`集合，用于收集依赖表
- [ ] 实现`collectTableDependencies`函数，递归收集表达式依赖的表
- [ ] 实现`buildJoinGraph`函数，构建join关系图
- [ ] 实现`findJoinPath`函数，使用BFS查找join路径
- [ ] 修改`resolveField`函数，自动添加字段所属表到依赖集合
- [ ] 修改metrics构建逻辑，调用`collectTableDependencies`
- [ ] 重写joins生成逻辑，使用动态计算的join路径

### Phase 3: 实现动态Join选择逻辑（V1版本）
- [ ] 参考V2版本，在V1版本中实现相同的逻辑
- [ ] 确保V1和V2的行为一致

### Phase 4: 测试验证
- [ ] 编写单元测试，验证join路径计算的正确性
- [ ] 测试单表查询（不需要join）
- [ ] 测试多表查询（需要join）
- [ ] 测试复杂指标依赖（指标引用其他表的字段）
- [ ] 测试过滤器中的表依赖
- [ ] 测试join路径的正确性和最短性

### Phase 5: 文档更新
- [ ] 更新API文档，说明DSL不再需要joins字段
- [ ] 更新示例代码
- [ ] 添加架构说明文档

## 关键改进点

### 1. 前端简化
前端只需关注查询什么数据，不需要知道表之间的关联关系：
```typescript
// 旧版本（需要指定joins）
const dsl = {
  datasetId: 1,
  tableId: 1,
  dimensions: [1, 2],
  metrics: [{id: 10}],
  joins: [{id: 1}, {id: 2}]  // 前端需要知道join关系
};

// 新版本（自动计算joins）
const dsl = {
  datasetId: 1,
  tableId: 1,
  dimensions: [1, 2],
  metrics: [{id: 10}]
  // joins由后端自动计算
};
```

### 2. 自动优化
只join必要的表，避免不必要的join：
- 如果查询只涉及主表，不会添加任何join
- 如果查询涉及多个表，只添加必要的join路径

### 3. 正确性保证
BFS确保join路径的正确性和最短性：
- 从主表出发，找到到达所有依赖表的最短路径
- 避免循环依赖
- 确保join顺序正确

### 4. 可维护性
join逻辑集中在后端，便于维护和优化：
- Dataset中的joins配置是唯一的join关系来源
- 查询转换器负责动态计算join路径
- 未来可以优化join算法（如使用更高效的图算法）

## 风险评估

### 潜在风险
1. **性能问题**：BFS算法在大规模join图上可能有性能问题
   - 缓解措施：Dataset中的表数量通常有限（<20），BFS性能足够
   
2. **兼容性问题**：现有前端代码可能依赖joins字段
   - 缓解措施：保留joins字段为可选，向后兼容
   
3. **join路径不唯一**：可能存在多条join路径
   - 缓解措施：BFS保证找到最短路径，且路径唯一

### 回滚方案
如果新方案有问题，可以：
1. 保留joins字段为可选，允许前端指定
2. 如果DSL包含joins，使用DSL中的joins
3. 如果DSL不包含joins，使用动态计算

## 验收标准

1. ✅ DSL不再需要joins字段
2. ✅ 单表查询不生成join
3. ✅ 多表查询生成正确的join
4. ✅ join路径是最短路径
5. ✅ 复杂指标依赖正确处理
6. ✅ 过滤器中的表依赖正确处理
7. ✅ V1和V2版本行为一致
8. ✅ 单元测试覆盖率>80%
