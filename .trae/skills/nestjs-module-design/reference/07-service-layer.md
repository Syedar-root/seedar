## 业务逻辑层规范
## 核心职责
定义业务逻辑层的完整编写规范，明确 Service 的职责边界，覆盖逻辑拆分、事务、错误处理、可测试性等细节，保证业务逻辑的清晰、可维护、可扩展
## 边界范围
仅聚焦 services 目录下的 Service 文件，不涉及其他层的实现
## 强制规范
### 1. 逻辑拆分规则
- 复杂业务逻辑必须拆分到不同的 Service 文件，禁止单文件代码过长
- 单文件代码行数（不含注释）严格控制在 300 行以内，超过必须拆分，每个 Service 只负责一个领域的业务逻辑
- 每个 Service 的方法必须遵循单一职责，一个方法只做一件事，禁止一个方法处理多个不相关的逻辑
- 拆分后的子 Service 必须通过 services 目录的 index.ts 统一导出，内部可直接导入
### 2. 依赖注入规范
- 每个 Service 的依赖数量不能超过 5 个，超过说明职责过多，需要拆分 Service，避免上帝类
- 所有依赖必须通过构造函数注入，禁止使用服务定位器、硬编码的依赖，保证可测试性
### 3. 注释与可读性规则
- 所有公共方法必须添加 JSDoc 注释，说明方法的作用、参数、返回值、异常
- 长逻辑链路（超过5步的处理流程）必须逐步骤添加行内注释，说明每一步的作用、输入与输出效果，让逻辑清晰易懂
- 复杂条件判断必须添加注释，说明判断的业务规则，避免魔法值、模糊的条件
### 4. 错误与幂等性规范
- 所有异步操作必须捕获错误，转换为业务异常，禁止抛出原生的 Error 或数据库异常，错误信息必须明确、可理解，对用户友好
- 所有写操作必须实现幂等性，通过幂等令牌、唯一业务标识避免重复提交，保证重复请求不会产生重复数据
### 5. 缓存与性能规范
- 高频查询的结果必须添加缓存，缓存的过期时间要合理，缓存更新要及时，避免缓存穿透、击穿、雪崩
- 共用业务逻辑必须上提至公共 Service，禁止重复实现相同的逻辑，避免逻辑冗余
### 6. 事务与数据流规则
- 业务逻辑必须严格单向流转，禁止反向修改上层数据
- 事务的边界必须清晰，写操作的事务必须在 Service 层声明，禁止跨 Service 的长事务
- 禁止在 Service 中直接操作请求/响应对象，禁止处理接口层的逻辑
### 7. 示例
```typescript
// 长逻辑链路注释示例
/**
 * 创建用户
 * @param dto 创建用户的请求DTO
 * @throws BadRequestException 邮箱已存在
 */
async createUser(dto: UserCreateRequestDto): Promise<UserResponseDto> {
  // 1. 验证邮箱是否已存在，避免重复注册，保证用户邮箱唯一
  const existingUser = await this.userRepository.findByEmail(dto.email);
  if (existingUser) {
    throw new BadRequestException('该邮箱已被注册，请更换邮箱');
  }

  // 2. 密码加密，将明文密码转换为bcrypt哈希值，保证密码存储安全，不可逆
  const passwordHash = await bcrypt.hash(dto.password, 10);

  // 3. 开启事务，保证用户创建的原子性，避免部分成功
  return this.dataSource.transaction(async (manager) => {
    // 4. 创建用户实体，组装数据，关联事务管理器
    const user = new User();
    user.username = dto.username;
    user.email = dto.email;
    user.passwordHash = passwordHash;
    user.role = dto.role || UserRole.USER;

    // 5. 保存用户到数据库，完成数据持久化，使用事务管理器保证事务
    const savedUser = await manager.save(User, user);

    // 6. 转换为响应DTO，过滤敏感字段（密码哈希）后返回
    return plainToInstance(UserResponseDto, savedUser);
  });
}
```
### 8. 禁止行为
- 禁止单文件代码过长，禁止将所有逻辑写在一个文件中，禁止上帝类
- 禁止长逻辑链路无注释，禁止模糊的逻辑处理，禁止魔法值
- 禁止在 Service 中处理接口层、数据访问层的职责，禁止跨层操作
- 禁止重复实现相同的业务逻辑，禁止逻辑冗余
- 禁止无幂等性的写操作，禁止重复提交导致的重复数据
- 禁止长事务，禁止跨多个Service的大事务，避免性能问题