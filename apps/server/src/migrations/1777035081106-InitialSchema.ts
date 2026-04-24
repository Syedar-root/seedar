import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1777035081106 implements MigrationInterface {
    name = 'InitialSchema1777035081106'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`datasource_columns\` (\`id\` int NOT NULL AUTO_INCREMENT, \`table_id\` int NOT NULL, \`column_name\` varchar(255) NOT NULL, \`raw_data_type\` varchar(255) NOT NULL, \`normalized_type\` enum ('string', 'number', 'boolean', 'date', 'datetime', 'decimal') NOT NULL, \`isPrimaryKey\` tinyint NOT NULL DEFAULT 0, \`nullable\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_3820ac11e0cfe44ff7cd28c64b\` (\`table_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dataset_field\` (\`id\` int NOT NULL AUTO_INCREMENT, \`dataset_id\` int NOT NULL, \`data_source_column_id\` int NOT NULL, \`table_id\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`type\` enum ('string', 'number', 'boolean', 'date', 'datetime', 'decimal') NOT NULL, \`alias\` varchar(255) NULL, \`description\` text NULL, \`business_name\` varchar(255) NOT NULL, \`is_primary_key\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dataset_tables\` (\`id\` int NOT NULL AUTO_INCREMENT, \`dataset_id\` int NOT NULL, \`datasource_table_id\` int NOT NULL, \`dataset_name\` varchar(100) NOT NULL, \`table_name\` varchar(255) NOT NULL, \`description\` text NULL, \`primary_field_id\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`datasource_tables\` (\`id\` int NOT NULL AUTO_INCREMENT, \`data_source_id\` int NOT NULL, \`table_name\` varchar(255) NOT NULL, \`table_comment\` text NULL, \`row_count\` int NULL, \`primary_field_id\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_e6279eeda59b58e9cacacf9724\` (\`data_source_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`datasources\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`type\` enum ('mysql', 'csv', 'excel', 'postgres', 'clickhouse') NOT NULL, \`config\` json NOT NULL, \`status\` enum ('active', 'invalid', 'deleted') NOT NULL DEFAULT 'active', \`lastValidateAt\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dataset_join\` (\`id\` int NOT NULL AUTO_INCREMENT, \`dataset_id\` int NOT NULL, \`joinType\` enum ('inner', 'left', 'right') NOT NULL DEFAULT 'inner', \`left_table_id\` int NOT NULL, \`left_field\` varchar(255) NOT NULL, \`right_table_id\` int NOT NULL, \`right_field\` varchar(255) NOT NULL, \`operator\` varchar(20) NOT NULL DEFAULT '=', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dataset\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`description\` varchar(255) NULL, \`status\` enum ('active', 'disabled', 'deleted') NOT NULL DEFAULT 'active', \`type\` enum ('semantic', 'wide') NOT NULL DEFAULT 'wide', \`main_table_id\` int NULL, \`datasource_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`query\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`datasetId\` int NOT NULL, \`dsl\` json NULL, \`status\` enum ('draft', 'active', 'stopped') NOT NULL DEFAULT 'draft', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ai_session\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NULL, \`type\` enum ('chat', 'single') NOT NULL DEFAULT 'chat', \`status\` enum ('active', 'archived') NOT NULL DEFAULT 'active', \`total_tokens\` int NOT NULL DEFAULT '0', \`deleted_at\` datetime(6) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`datasource_meta_version\` (\`id\` int NOT NULL AUTO_INCREMENT, \`version\` int NOT NULL, \`refreshedAt\` datetime NOT NULL, \`remark\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`datasource_id\` int NULL, UNIQUE INDEX \`REL_8d34780898672b2297f4363519\` (\`datasource_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`wide_table_config\` (\`id\` int NOT NULL AUTO_INCREMENT, \`dataset_id\` int NOT NULL, \`target_table_name\` varchar(255) NOT NULL, \`sync_strategy\` enum ('manual', 't+1') NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`datasource_foreign_keys\` (\`id\` int NOT NULL AUTO_INCREMENT, \`data_source_id\` int NOT NULL, \`fk_name\` varchar(255) NOT NULL, \`source_table_name\` varchar(255) NOT NULL, \`source_column_name\` varchar(255) NOT NULL, \`target_table_name\` varchar(255) NOT NULL, \`target_column_name\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_00c3f834342850532a40215d17\` (\`data_source_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dataset_metric\` (\`id\` int NOT NULL AUTO_INCREMENT, \`dataset_id\` int NOT NULL, \`metricType\` enum ('row_level', 'aggregate', 'post_aggregate', 'arithmetic', 'period_over_period') NOT NULL DEFAULT 'aggregate', \`name\` varchar(255) NOT NULL, \`alias\` varchar(255) NULL, \`description\` text NULL, \`business_name\` varchar(255) NULL, \`data_source_column_id\` int NULL, \`left_operand\` int NULL, \`row_operator\` varchar(10) NULL, \`right_operand\` int NULL, \`aggregate_function\` enum ('sum', 'count', 'avg', 'max', 'min', 'distinct_count') NULL, \`distinct\` tinyint NOT NULL DEFAULT 0, \`aggregate_condition\` json NULL, \`source_metric_id\` int NULL, \`left_metric_id\` int NULL, \`arithmetic_operator\` varchar(10) NULL, \`right_metric_operand\` int NULL, \`base_metric_id\` int NULL, \`time_field_id\` int NULL, \`time_data_source_column_id\` int NULL, \`period_type\` enum ('day_over_day', 'week_over_week', 'month_over_month', 'quarter_over_quarter', 'year_over_year') NULL, \`calculation_mode\` enum ('percentage', 'absolute', 'both') NULL, \`expression\` varchar(1000) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dashboard\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`layout\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dashboard_panels\` (\`dashboard_id\` varchar(36) NOT NULL, \`panel_id\` varchar(36) NOT NULL, PRIMARY KEY (\`dashboard_id\`, \`panel_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`panel\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NULL, \`title_config\` json NULL, \`type\` enum ('chart', 'table', 'text', 'card') NOT NULL DEFAULT 'chart', \`status\` enum ('draft', 'published') NOT NULL DEFAULT 'draft', \`query_id\` varchar(255) NULL, \`config\` json NULL, \`width\` int NULL, \`height\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ai\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`description\` varchar(255) NULL, \`type\` enum ('chat', 'completion', 'embedding') NOT NULL DEFAULT 'chat', \`status\` enum ('active', 'inactive') NOT NULL DEFAULT 'active', \`config\` json NULL, \`deleted_at\` datetime(6) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`datasource_columns\` ADD CONSTRAINT \`FK_3820ac11e0cfe44ff7cd28c64bf\` FOREIGN KEY (\`table_id\`) REFERENCES \`datasource_tables\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset_field\` ADD CONSTRAINT \`FK_00028b442ab06bfea3ae8b45f90\` FOREIGN KEY (\`table_id\`) REFERENCES \`dataset_tables\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset_tables\` ADD CONSTRAINT \`FK_632c0e6b2aebbf0f7c457067202\` FOREIGN KEY (\`dataset_id\`) REFERENCES \`dataset\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset_tables\` ADD CONSTRAINT \`FK_11cb64c25a4d2fc5caf16bb35eb\` FOREIGN KEY (\`datasource_table_id\`) REFERENCES \`datasource_tables\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`datasource_tables\` ADD CONSTRAINT \`FK_e6279eeda59b58e9cacacf97247\` FOREIGN KEY (\`data_source_id\`) REFERENCES \`datasources\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset_join\` ADD CONSTRAINT \`FK_ec199c34d5d10283147b9b29b6c\` FOREIGN KEY (\`dataset_id\`) REFERENCES \`dataset\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset\` ADD CONSTRAINT \`FK_d07c6ddb17bd412f507304b7448\` FOREIGN KEY (\`datasource_id\`) REFERENCES \`datasources\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset\` ADD CONSTRAINT \`FK_6811fc56f5ba0d7bafb098fa970\` FOREIGN KEY (\`main_table_id\`) REFERENCES \`dataset_tables\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`query\` ADD CONSTRAINT \`FK_cbb40fedf39a03fc7e5036aefd2\` FOREIGN KEY (\`datasetId\`) REFERENCES \`dataset\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`datasource_meta_version\` ADD CONSTRAINT \`FK_8d34780898672b2297f4363519c\` FOREIGN KEY (\`datasource_id\`) REFERENCES \`datasources\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`datasource_foreign_keys\` ADD CONSTRAINT \`FK_00c3f834342850532a40215d17e\` FOREIGN KEY (\`data_source_id\`) REFERENCES \`datasources\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` ADD CONSTRAINT \`FK_7442775131807fb26e3817c1b8c\` FOREIGN KEY (\`dataset_id\`) REFERENCES \`dataset\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` ADD CONSTRAINT \`FK_d20d10c956ff1eb9c08cb7a07ec\` FOREIGN KEY (\`data_source_column_id\`) REFERENCES \`datasource_columns\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` ADD CONSTRAINT \`FK_6e6c4db9a97b9d15c0c11df2e8e\` FOREIGN KEY (\`left_operand\`) REFERENCES \`datasource_columns\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` ADD CONSTRAINT \`FK_b2aba05b6bebf79092dac7e1666\` FOREIGN KEY (\`right_operand\`) REFERENCES \`datasource_columns\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` ADD CONSTRAINT \`FK_b6521645d8ba60140386b705e24\` FOREIGN KEY (\`source_metric_id\`) REFERENCES \`dataset_metric\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` ADD CONSTRAINT \`FK_a09eec4592ee368fcd5becbcf8d\` FOREIGN KEY (\`left_metric_id\`) REFERENCES \`dataset_metric\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` ADD CONSTRAINT \`FK_0ae977cd7bbe1321da0a366ae6f\` FOREIGN KEY (\`right_metric_operand\`) REFERENCES \`dataset_metric\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` ADD CONSTRAINT \`FK_b5b9b167820f78f37e9a87e3e18\` FOREIGN KEY (\`base_metric_id\`) REFERENCES \`dataset_metric\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` ADD CONSTRAINT \`FK_e003939b0583843cccc06301c14\` FOREIGN KEY (\`time_field_id\`) REFERENCES \`dataset_field\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` ADD CONSTRAINT \`FK_85b0f13aea70947c47cb5208c9a\` FOREIGN KEY (\`time_data_source_column_id\`) REFERENCES \`datasource_columns\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dashboard_panels\` ADD CONSTRAINT \`FK_3aaa250f793e134a58d9a90b537\` FOREIGN KEY (\`dashboard_id\`) REFERENCES \`dashboard\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dashboard_panels\` ADD CONSTRAINT \`FK_7db0f111ecaf5a7c5385368ac56\` FOREIGN KEY (\`panel_id\`) REFERENCES \`panel\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`panel\` ADD CONSTRAINT \`FK_adbc47e51593fd6314b5d7c3f64\` FOREIGN KEY (\`query_id\`) REFERENCES \`query\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`panel\` DROP FOREIGN KEY \`FK_adbc47e51593fd6314b5d7c3f64\``);
        await queryRunner.query(`ALTER TABLE \`dashboard_panels\` DROP FOREIGN KEY \`FK_7db0f111ecaf5a7c5385368ac56\``);
        await queryRunner.query(`ALTER TABLE \`dashboard_panels\` DROP FOREIGN KEY \`FK_3aaa250f793e134a58d9a90b537\``);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` DROP FOREIGN KEY \`FK_85b0f13aea70947c47cb5208c9a\``);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` DROP FOREIGN KEY \`FK_e003939b0583843cccc06301c14\``);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` DROP FOREIGN KEY \`FK_b5b9b167820f78f37e9a87e3e18\``);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` DROP FOREIGN KEY \`FK_0ae977cd7bbe1321da0a366ae6f\``);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` DROP FOREIGN KEY \`FK_a09eec4592ee368fcd5becbcf8d\``);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` DROP FOREIGN KEY \`FK_b6521645d8ba60140386b705e24\``);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` DROP FOREIGN KEY \`FK_b2aba05b6bebf79092dac7e1666\``);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` DROP FOREIGN KEY \`FK_6e6c4db9a97b9d15c0c11df2e8e\``);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` DROP FOREIGN KEY \`FK_d20d10c956ff1eb9c08cb7a07ec\``);
        await queryRunner.query(`ALTER TABLE \`dataset_metric\` DROP FOREIGN KEY \`FK_7442775131807fb26e3817c1b8c\``);
        await queryRunner.query(`ALTER TABLE \`datasource_foreign_keys\` DROP FOREIGN KEY \`FK_00c3f834342850532a40215d17e\``);
        await queryRunner.query(`ALTER TABLE \`datasource_meta_version\` DROP FOREIGN KEY \`FK_8d34780898672b2297f4363519c\``);
        await queryRunner.query(`ALTER TABLE \`query\` DROP FOREIGN KEY \`FK_cbb40fedf39a03fc7e5036aefd2\``);
        await queryRunner.query(`ALTER TABLE \`dataset\` DROP FOREIGN KEY \`FK_6811fc56f5ba0d7bafb098fa970\``);
        await queryRunner.query(`ALTER TABLE \`dataset\` DROP FOREIGN KEY \`FK_d07c6ddb17bd412f507304b7448\``);
        await queryRunner.query(`ALTER TABLE \`dataset_join\` DROP FOREIGN KEY \`FK_ec199c34d5d10283147b9b29b6c\``);
        await queryRunner.query(`ALTER TABLE \`datasource_tables\` DROP FOREIGN KEY \`FK_e6279eeda59b58e9cacacf97247\``);
        await queryRunner.query(`ALTER TABLE \`dataset_tables\` DROP FOREIGN KEY \`FK_11cb64c25a4d2fc5caf16bb35eb\``);
        await queryRunner.query(`ALTER TABLE \`dataset_tables\` DROP FOREIGN KEY \`FK_632c0e6b2aebbf0f7c457067202\``);
        await queryRunner.query(`ALTER TABLE \`dataset_field\` DROP FOREIGN KEY \`FK_00028b442ab06bfea3ae8b45f90\``);
        await queryRunner.query(`ALTER TABLE \`datasource_columns\` DROP FOREIGN KEY \`FK_3820ac11e0cfe44ff7cd28c64bf\``);
        await queryRunner.query(`DROP TABLE \`ai\``);
        await queryRunner.query(`DROP TABLE \`panel\``);
        await queryRunner.query(`DROP TABLE \`dashboard_panels\``);
        await queryRunner.query(`DROP TABLE \`dashboard\``);
        await queryRunner.query(`DROP TABLE \`dataset_metric\``);
        await queryRunner.query(`DROP INDEX \`IDX_00c3f834342850532a40215d17\` ON \`datasource_foreign_keys\``);
        await queryRunner.query(`DROP TABLE \`datasource_foreign_keys\``);
        await queryRunner.query(`DROP TABLE \`wide_table_config\``);
        await queryRunner.query(`DROP INDEX \`REL_8d34780898672b2297f4363519\` ON \`datasource_meta_version\``);
        await queryRunner.query(`DROP TABLE \`datasource_meta_version\``);
        await queryRunner.query(`DROP TABLE \`ai_session\``);
        await queryRunner.query(`DROP TABLE \`query\``);
        await queryRunner.query(`DROP TABLE \`dataset\``);
        await queryRunner.query(`DROP TABLE \`dataset_join\``);
        await queryRunner.query(`DROP TABLE \`datasources\``);
        await queryRunner.query(`DROP INDEX \`IDX_e6279eeda59b58e9cacacf9724\` ON \`datasource_tables\``);
        await queryRunner.query(`DROP TABLE \`datasource_tables\``);
        await queryRunner.query(`DROP TABLE \`dataset_tables\``);
        await queryRunner.query(`DROP TABLE \`dataset_field\``);
        await queryRunner.query(`DROP INDEX \`IDX_3820ac11e0cfe44ff7cd28c64b\` ON \`datasource_columns\``);
        await queryRunner.query(`DROP TABLE \`datasource_columns\``);
    }

}
