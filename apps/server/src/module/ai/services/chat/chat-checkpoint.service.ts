import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemorySaver } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

@Injectable()
export class ChatCheckpointService implements OnModuleDestroy {
  private readonly logger = new Logger(ChatCheckpointService.name);
  private readonly memoryCheckpointer = new MemorySaver();
  private checkpointSetupPromise: Promise<void> | null = null;
  private postgresCheckpointer: PostgresSaver | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Return active checkpointer (Postgres preferred, memory fallback).
   */
  async getCheckpointer() {
    await this.ensureCheckpointReady();
    return this.postgresCheckpointer ?? this.memoryCheckpointer;
  }

  /**
   * Fetch checkpoint tuple for the given thread id.
   */
  async getCheckpointTupleByThreadId(threadId: string) {
    const checkpointer = await this.getCheckpointer();
    return checkpointer.getTuple({
      configurable: { thread_id: threadId },
    });
  }

  /**
   * Close Postgres checkpointer connection on module shutdown.
   */
  async onModuleDestroy(): Promise<void> {
    if (this.postgresCheckpointer) {
      await this.postgresCheckpointer.end();
    }
  }

  /**
   * Read checkpoint Postgres connection string from config.
   */
  private getCheckpointConnectionString(): string | undefined {
    return this.configService.get<string>('AI_CHECKPOINT_PG_URL');
  }

  /**
   * Lazily initialize PostgresSaver and degrade gracefully on failure.
   */
  private async ensureCheckpointReady(): Promise<void> {
    if (this.postgresCheckpointer) {
      return;
    }

    if (this.checkpointSetupPromise) {
      await this.checkpointSetupPromise;
      return;
    }

    const connectionString = this.getCheckpointConnectionString();
    if (!connectionString) {
      return;
    }

    this.checkpointSetupPromise = (async () => {
      try {
        const checkpointer = PostgresSaver.fromConnString(connectionString);
        await checkpointer.setup();
        this.postgresCheckpointer = checkpointer;
        this.logger.log('LangGraph checkpoint 已切换为 PostgresSaver');
      } catch (error) {
        this.postgresCheckpointer = null;
        this.logger.error(
          'Postgres checkpoint 初始化失败，已降级为 MemorySaver',
          error instanceof Error ? error.stack : String(error),
        );
      }
    })();

    await this.checkpointSetupPromise;
  }
}
