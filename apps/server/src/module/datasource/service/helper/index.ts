import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ExceptionFactory } from '../../../../common/exceptions';
import { MySqlConfig } from '../../datasource.types';

const algorithm = 'aes-128-cbc';

/**
 * 加密配置中的密码字段
 * @param config MySQL配置对象
 * @param configService 配置服务
 * @returns 加密后的配置对象
 */
export function configEncryption(
  config: MySqlConfig,
  configService: ConfigService,
): MySqlConfig {
  // 创建配置对象的深拷贝，避免修改原对象
  const encryptedConfig: MySqlConfig = JSON.parse(
    JSON.stringify(config),
  ) as MySqlConfig;

  if (encryptedConfig.password) {
    const base64Str = Buffer.from(encryptedConfig.password, 'utf8').toString(
      'base64',
    );
    const iv = encryptedConfig.iv
      ? Buffer.from(encryptedConfig.iv, 'hex')
      : crypto.randomBytes(16);
    try {
      // 获取密钥，确保为 Buffer 类型，且长度符合算法要求
      const key = configService.get<string>('AES_SECRET');
      if (!key) {
        throw new Error('未配置 AES_SECRET');
      }

      // 创建加密器（参数：算法、密钥、iv）
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      // 加密（更新+最终），输出hex格式
      let encrypted = cipher.update(base64Str, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      encryptedConfig.password = encrypted;
      encryptedConfig.iv = iv.toString('hex');
      return encryptedConfig;
    } catch (error) {
      ExceptionFactory.internalError('AES加密失败', error);
    }
  }
  return encryptedConfig;
}

/**
 * 解密配置中的密码字段
 * @param config MySQL配置对象
 * @param configService 配置服务
 * @returns 解密后的配置对象
 */
export function configDecryption(
  config: MySqlConfig,
  configService: ConfigService,
): MySqlConfig {
  // 创建配置对象的深拷贝，避免修改原对象
  const decryptedConfig: MySqlConfig = JSON.parse(
    JSON.stringify(config),
  ) as MySqlConfig;

  if (decryptedConfig.password && decryptedConfig.iv) {
    try {
      // 获取密钥
      const key = configService.get<string>('AES_SECRET');
      if (!key) {
        throw new Error('未配置 AES_SECRET');
      }

      // 将 iv 从 hex 转换为 Buffer
      const iv = Buffer.from(decryptedConfig.iv, 'hex');

      // 创建解密器（参数：算法、密钥、iv）
      const decipher = crypto.createDecipheriv(algorithm, key, iv);

      // 解密（更新+最终），输入hex格式，输出utf8
      let decrypted = decipher.update(decryptedConfig.password, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // 从 base64 转换回原始密码
      const originalPassword = Buffer.from(decrypted, 'base64').toString(
        'utf8',
      );
      decryptedConfig.password = originalPassword;

      return decryptedConfig;
    } catch (error) {
      ExceptionFactory.internalError('AES解密失败', error);
    }
  }
  return decryptedConfig;
}
