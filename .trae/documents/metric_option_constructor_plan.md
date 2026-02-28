# 指标类Option对象构造器实现计划

## 任务分解和优先级

### [ ] 任务1: 为基础Metric类添加Option构造器支持
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 创建`MetricOptions`接口，包含name、alias、description、businessName字段
  - 为Metric类添加构造函数重载，支持传统参数和options对象
  - 实现构造函数逻辑，根据参数类型选择初始化方式
- **Success Criteria**:
  - Metric类可以通过options对象创建
  - 保持向后兼容性
- **Test Requirements**:
  - `programmatic` TR-1.1: 可以通过传统参数创建Metric实例
  - `programmatic` TR-1.2: 可以通过options对象创建Metric实例
  - `human-judgement` TR-1.3: 代码可读性良好，类型定义清晰

### [ ] 任务2: 为RowLevelMetric类添加Option构造器支持
- **Priority**: P1
- **Depends On**: 任务1
- **Description**:
  - 创建`RowLevelMetricOptions`接口，继承MetricOptions并添加expression字段
  - 为RowLevelMetric类添加构造函数重载
  - 实现构造函数逻辑
- **Success Criteria**:
  - RowLevelMetric类可以通过options对象创建
  - 保持向后兼容性
- **Test Requirements**:
  - `programmatic` TR-2.1: 可以通过传统参数创建RowLevelMetric实例
  - `programmatic` TR-2.2: 可以通过options对象创建RowLevelMetric实例

### [ ] 任务3: 为AggregateMetric类添加Option构造器支持
- **Priority**: P1
- **Depends On**: 任务1
- **Description**:
  - 创建`AggregateMetricOptions`接口，继承MetricOptions并添加function、field、distinct、condition字段
  - 为AggregateMetric类添加构造函数重载
  - 实现构造函数逻辑
- **Success Criteria**:
  - AggregateMetric类可以通过options对象创建
  - 保持向后兼容性
- **Test Requirements**:
  - `programmatic` TR-3.1: 可以通过传统参数创建AggregateMetric实例
  - `programmatic` TR-3.2: 可以通过options对象创建AggregateMetric实例

### [ ] 任务4: 为PostAggregateMetric类添加Option构造器支持
- **Priority**: P1
- **Depends On**: 任务1
- **Description**:
  - 创建`PostAggregateMetricOptions`接口，继承MetricOptions并添加function、metric、distinct字段
  - 为PostAggregateMetric类添加构造函数重载
  - 实现构造函数逻辑
- **Success Criteria**:
  - PostAggregateMetric类可以通过options对象创建
  - 保持向后兼容性
- **Test Requirements**:
  - `programmatic` TR-4.1: 可以通过传统参数创建PostAggregateMetric实例
  - `programmatic` TR-4.2: 可以通过options对象创建PostAggregateMetric实例

### [ ] 任务5: 为SubQueryMetric类添加Option构造器支持
- **Priority**: P1
- **Depends On**: 任务1
- **Description**:
  - 创建`SubQueryMetricOptions`接口，继承MetricOptions并添加subQueryTemplate、contextFieldMapping、parameters字段
  - 为SubQueryMetric类添加构造函数重载
  - 实现构造函数逻辑
- **Success Criteria**:
  - SubQueryMetric类可以通过options对象创建
  - 保持向后兼容性
- **Test Requirements**:
  - `programmatic` TR-5.1: 可以通过传统参数创建SubQueryMetric实例
  - `programmatic` TR-5.2: 可以通过options对象创建SubQueryMetric实例

### [ ] 任务6: 为ArithmeticMetric类添加Option构造器支持
- **Priority**: P1
- **Depends On**: 任务1
- **Description**:
  - 创建`ArithmeticMetricOptions`接口，继承MetricOptions并添加leftMetric、operator、rightOperand字段
  - 为ArithmeticMetric类添加构造函数重载
  - 实现构造函数逻辑
- **Success Criteria**:
  - ArithmeticMetric类可以通过options对象创建
  - 保持向后兼容性
- **Test Requirements**:
  - `programmatic` TR-6.1: 可以通过传统参数创建ArithmeticMetric实例
  - `programmatic` TR-6.2: 可以通过options对象创建ArithmeticMetric实例

### [ ] 任务7: 为PeriodOverPeriodMetric类添加Option构造器支持
- **Priority**: P1
- **Depends On**: 任务1
- **Description**:
  - 创建`PeriodOverPeriodMetricOptions`接口，包含baseMetric、periodType、calculationMode、timeField、alias、description字段
  - 为PeriodOverPeriodMetric类添加构造函数重载
  - 实现构造函数逻辑，注意处理自动生成名称和描述的逻辑
- **Success Criteria**:
  - PeriodOverPeriodMetric类可以通过options对象创建
  - 保持向后兼容性
- **Test Requirements**:
  - `programmatic` TR-7.1: 可以通过传统参数创建PeriodOverPeriodMetric实例
  - `programmatic` TR-7.2: 可以通过options对象创建PeriodOverPeriodMetric实例

### [ ] 任务8: 为MetricExpression类添加Option构造器支持
- **Priority**: P1
- **Depends On**: None
- **Description**:
  - 创建`MetricExpressionOptions`接口，包含left、operator、right字段
  - 为MetricExpression类添加构造函数重载
  - 实现构造函数逻辑
- **Success Criteria**:
  - MetricExpression类可以通过options对象创建
  - 保持向后兼容性
- **Test Requirements**:
  - `programmatic` TR-8.1: 可以通过传统参数创建MetricExpression实例
  - `programmatic` TR-8.2: 可以通过options对象创建MetricExpression实例

### [ ] 任务9: 运行类型检查和测试
- **Priority**: P2
- **Depends On**: 任务1-8
- **Description**:
  - 运行TypeScript类型检查，确保没有类型错误
  - 运行项目测试，确保所有测试通过
- **Success Criteria**:
  - 类型检查通过
  - 所有测试通过
- **Test Requirements**:
  - `programmatic` TR-9.1: TypeScript编译无错误
  - `programmatic` TR-9.2: 项目测试全部通过

### [ ] 任务10: 修改dsl-transformer.ts使用Option构造器创建指标
- **Priority**: P1
- **Depends On**: 任务1-8
- **Description**:
  - 修改dsl-transformer.ts文件，将所有指标类的创建方式改为使用option对象
  - 为所有指标添加businessName属性
- **Success Criteria**:
  - dsl-transformer.ts中所有指标创建都使用option方式
  - 所有指标都包含businessName属性
- **Test Requirements**:
  - `programmatic` TR-10.1: 代码编译无错误
  - `programmatic` TR-10.2: 所有指标创建都使用option方式
  - `programmatic` TR-10.3: 所有指标都包含businessName属性

## 实现策略

1. **类型安全**：使用TypeScript接口定义options对象的结构，确保类型安全
2. **向后兼容**：保留原有的构造函数签名，确保现有代码不受影响
3. **代码清晰**：使用构造函数重载，使代码结构清晰易读
4. **渐进式实现**：按照依赖关系顺序实现，先实现基础类，再实现子类
5. **测试验证**：每个任务完成后进行测试，确保功能正常

## 预期成果

- 所有指标类都支持通过options对象创建
- 保持向后兼容性，现有代码无需修改
- 代码类型定义清晰，可读性良好
- 所有测试通过，无类型错误