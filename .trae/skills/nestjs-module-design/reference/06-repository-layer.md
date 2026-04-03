## 数据访问层规范
## 核心职责
定义数据访问层的完整编写规范，明确 Repository 的职责边界，覆盖事务、分页、性能、错误处理等细节，保证数据操作的一致性与性能
## 边界范围
仅聚焦 repositories 目录下的 Repository 文件，不涉及其他层的实现
## 强制规范
### 1. Repository 基础规范
- 所有数据操作必须封装在 Repository 中，禁止 Service 直接使用 `EntityManager` 或原生 Repository 方法操作数据
- 所有 Repository 必须继承公共的 `BaseRepository`，复用通用的分页、批量操作方法，禁止每个 Repository 重复实现通用逻辑
- Repository 必须使用自定义 Repository 装饰器，绑定对应的实体，禁止无绑定的 Repository
### 2. 事务规范
- 所有写操作（创建、更新、删除），尤其是跨多个 Repository 的操作，必须使用事务，保证数据的一致性，避免部分成功部分失败
- 事务的范围必须尽可能小，仅包裹写操作的部分，禁止将整个方法都包裹在事务中，避免长事务
### 3. 查询与性能规范
- 所有数据查询必须明确查询条件，禁止无条件的全表查询
- 所有关联查询必须使用 `leftJoinAndSelect` 手动加载关联数据，禁止循环查询，禁止默认急加载，彻底避免 N+1 查询问题
- 查询时必须指定查询的字段，使用 `select` 投影，只查询需要的字段，禁止查询所有字段，提升查询性能
- 软删除查询：默认查询自动过滤已软删除的数据，需要查询已删除数据时必须手动添加 `withDeleted()` 条件，禁止默认查询已删除数据
### 4. 分页与批量操作规范
- 所有分页查询必须使用统一的分页方法，返回统一的 `PageResult`，禁止自定义分页实现
- 批量创建、更新、删除必须使用批量操作方法，禁止循环单条操作，提升批量操作的性能
### 5. 错误处理规范
- 数据不存在时必须抛出 `NotFoundException`，禁止返回 `null`，统一异常处理，让上层可以明确感知数据不存在的情况
- 唯一键冲突时必须捕获异常，转换为业务异常，提示用户数据已存在，禁止直接抛出数据库的原始异常
### 6. 示例
```typescript
// 正确示例
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@common/repositories/base.repository';
import { User } from '../entities';
import { PageQueryRequestDto, PageResult } from '@common/dto';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  /**
   * 根据邮箱查询用户
   * @param email 用户邮箱
   */
  async findByEmail(email: string): Promise<User | null> {
    // 只查询需要的字段，密码字段默认不查询
    return this.repo.findOne({ 
      where: { email },
      select: ['id', 'username', 'email', 'passwordHash'],
    });
  }

  /**
   * 分页查询用户列表
   * @param query 分页查询参数
   */
  async findUserList(query: PageQueryRequestDto): Promise<PageResult<User>> {
    return this.paginate(query, {
      where: { isActive: true },
      order: { createdAt: query.order as 'ASC' | 'DESC' },
    });
  }
}
```
### 7. 禁止行为
- 禁止 Service 直接操作数据库，禁止 Service 编写数据查询逻辑
- 禁止 Repository 处理业务逻辑，Repository 仅做数据操作，不处理业务规则
- 禁止无事务的跨表写操作，禁止长事务，避免数据不一致
- 禁止全表查询，禁止无索引的查询，避免慢查询
- 禁止 N+1 查询，禁止循环查询关联数据，避免性能问题
- 禁止直接抛出数据库的原始异常，禁止暴露数据库的内部错误给上层