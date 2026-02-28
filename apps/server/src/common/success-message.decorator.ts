import { SetMetadata } from '@nestjs/common';

export const SUCCESS_MESSAGE_KEY = 'successMessage';

/**
 * 自定义成功消息装饰器
 * 使用方式：
 * @SuccessMessage('操作成功')
 * @Get()
 */
export const SuccessMessage = (message: string): MethodDecorator =>
  SetMetadata(SUCCESS_MESSAGE_KEY, message);
