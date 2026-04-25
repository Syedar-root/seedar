import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ExceptionFactory } from '../../../../common/exceptions';
import { MySqlConfig } from '../../datasource.types';

const algorithm = 'aes-128-cbc';
const AES_KEY_LENGTH = 16;

function readAesSecret(configService: ConfigService): string {
  const secret = configService.get<string>('AES_SECRET');
  if (!secret) {
    throw new Error('未配置 AES_SECRET');
  }
  return secret;
}

function deriveAesKey(secret: string): Buffer {
  return crypto
    .createHash('sha256')
    .update(secret, 'utf8')
    .digest()
    .subarray(0, AES_KEY_LENGTH);
}

function deriveLegacyAesKey(secret: string): Buffer | null {
  const keyBuffer = Buffer.from(secret, 'utf8');
  return keyBuffer.length === AES_KEY_LENGTH ? keyBuffer : null;
}

function decryptWithKey(
  encryptedHex: string,
  iv: Buffer,
  key: Buffer,
): string {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

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
      const key = deriveAesKey(readAesSecret(configService));

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
      const secret = readAesSecret(configService);

      // 将 iv 从 hex 转换为 Buffer
      const iv = Buffer.from(decryptedConfig.iv, 'hex');

      let decrypted: string;
      try {
        decrypted = decryptWithKey(
          decryptedConfig.password,
          iv,
          deriveAesKey(secret),
        );
      } catch (error) {
        const legacyKey = deriveLegacyAesKey(secret);
        if (!legacyKey) {
          throw error;
        }
        decrypted = decryptWithKey(decryptedConfig.password, iv, legacyKey);
      }

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
