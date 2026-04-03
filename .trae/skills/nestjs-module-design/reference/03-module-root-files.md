## 根目录核心文件规范
## 核心职责
定义模块根目录下核心文件的使用规则、书写规范，明确对外导出的约束
## 边界范围
仅聚焦根目录下的 index.ts、module.ts 等核心文件，不涉及子目录文件
## 强制规范
### 1. index.ts 规范
- 仅导出模块的核心公共资源：模块类、公共Service、公共类型，禁止导出内部私有资源
- 导出格式：统一使用命名导出，禁止默认导出
- 示例：
```typescript
// 正确示例
export * from './user.module';
export * from './services/user.service';
export type { UserResponseDto } from './dto';

// 错误示例
export * from './entities'; // 禁止导出内部实体
export default UserModule; // 禁止默认导出
```
### 2. module.ts 规范
- 仅做模块配置：声明 imports、controllers、providers、exports，禁止在该文件编写业务逻辑
- 依赖注入仅声明当前模块的资源，禁止引入过多全局资源
- 导出仅导出需要被其他模块使用的 providers，禁止导出内部私有资源
- 示例：
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [UserController],
  providers: [UserService, UserRepository, UserRoleService],
  exports: [UserService], // 仅导出公共Service
})
export class UserModule {}
```
### 3. 禁止行为
- 禁止在根目录文件编写业务逻辑、数据操作
- 禁止对外暴露内部私有资源（如内部 Repository、内部 Service、实体等）
- 禁止在根目录文件添加冗余代码、调试代码