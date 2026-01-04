@echo off
echo 创建环境配置文件示例...

REM 开发环境
(
echo # 开发环境配置
echo NODE_ENV=development
echo.
echo # 开发数据库
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_USERNAME=root
echo DB_PASSWORD=dev_password
echo DB_DATABASE=seedar_dev
echo.
echo # 开发服务器端口
echo PORT=3000
) > .env.development

REM 生产环境
(
echo # 生产环境配置
echo NODE_ENV=production
echo.
echo # 生产数据库
echo DB_HOST=your-production-db-host
echo DB_PORT=3306
echo DB_USERNAME=prod_user
echo DB_PASSWORD=prod_secure_password
echo DB_DATABASE=seedar_prod
echo.
echo # 生产服务器端口
echo PORT=8080
) > .env.production

REM 测试环境
(
echo # 测试环境配置
echo NODE_ENV=test
echo.
echo # 测试数据库
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_USERNAME=root
echo DB_PASSWORD=test_password
echo DB_DATABASE=seedar_test
echo.
echo # 测试服务器端口
echo PORT=3001
) > .env.test

echo 环境配置文件创建完成！
echo 请根据需要修改其中的配置值。
echo.
echo 使用方法：
echo 开发环境: NODE_ENV=development npm run start:dev
echo 生产环境: NODE_ENV=production npm run start:prod
echo 测试环境: NODE_ENV=test npm run start:dev

pause
