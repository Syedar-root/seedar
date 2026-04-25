import knex from "knex";
import { DatabaseClient, DatabaseDialect, KnexQueryBuilder } from "../../src";

/**
 * Returns a builder configured with the given dialect so that tests can
 * assume a stable SQL dialect (MySQL by default).
 */
export function createTestBuilder(client: DatabaseClient = "mysql2") {
  DatabaseDialect.setClient(client);
  const knexInstance = knex({ client });
  return new KnexQueryBuilder(knexInstance);
}
