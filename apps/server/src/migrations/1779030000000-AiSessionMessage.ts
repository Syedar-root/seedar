import { MigrationInterface, QueryRunner } from 'typeorm';

export class AiSessionMessage1779030000000 implements MigrationInterface {
  name = 'AiSessionMessage1779030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`ai_session_message\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`session_id\` varchar(36) NOT NULL,
        \`turn_id\` varchar(64) NOT NULL,
        \`sid\` varchar(64) NOT NULL,
        \`message_type\` varchar(32) NOT NULL,
        \`role\` varchar(32) NULL,
        \`content_text\` longtext NULL,
        \`content_json\` json NULL,
        \`meta_json\` json NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_ai_session_message_session_id_id\` (\`session_id\`, \`id\`),
        KEY \`IDX_ai_session_message_session_id_turn_id\` (\`session_id\`, \`turn_id\`),
        KEY \`IDX_ai_session_message_session_id_sid\` (\`session_id\`, \`sid\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`ai_session_message\``);
  }
}
