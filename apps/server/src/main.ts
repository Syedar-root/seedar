import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false, // 禁用默认logger，我们使用自定义logger
  });

  // 设置全局日志上下文
  const logger = app.get(LoggerService);
  logger.setContext('NestApplication');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // 启动成功后的有趣输出
  const url = await app.getUrl();

  console.log('\n' + '='.repeat(60));
  console.log('🚀 服务器启动成功!');
  console.log('=' + '='.repeat(59));
  console.log(`📍 本地访问地址: http://localhost:${port}`);
  console.log(`🌐 网络访问地址: ${url}`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 日志目录: ${process.cwd()}/logs`);
  console.log('='.repeat(60));
  console.log('🎉 应用已就绪，准备接受请求!');
  console.log('💡 提示: 可以使用 Ctrl+C 停止服务器');
  console.log('='.repeat(60) + '\n');

  // 使用自定义logger记录启动成功
  logger.log(`🚀 服务器启动成功，监听端口 ${port}`, 'Bootstrap');
}
bootstrap();
