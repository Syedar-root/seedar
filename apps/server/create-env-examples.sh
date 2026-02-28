#!/bin/bash

# 创建环境配置文件示例
echo "创建环境配置文件示例..."

# 开发环境
cat > .env.development << EOF
# 开发环境配置
NODE_ENV=development

# 开发数据库
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=dev_password
DB_DATABASE=seedar_dev

# 开发服务器端口
PORT=3000
EOF

# 生产环境
cat > .env.production << EOF
# 生产环境配置
NODE_ENV=production

# 生产数据库
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USERNAME=prod_user
DB_PASSWORD=prod_secure_password
DB_DATABASE=seedar_prod

# 生产服务器端口
PORT=8080
EOF

# 测试环境
cat > .env.test << EOF
# 测试环境配置
NODE_ENV=test

# 测试数据库
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=test_password
DB_DATABASE=seedar_test

# 测试服务器端口
PORT=3001
EOF

echo "环境配置文件创建完成！"
echo "请根据需要修改其中的配置值。"
echo ""
echo "使用方法："
echo "开发环境: NODE_ENV=development npm run start:dev"
echo "生产环境: NODE_ENV=production npm run start:prod"
echo "测试环境: NODE_ENV=test npm run start:dev"
