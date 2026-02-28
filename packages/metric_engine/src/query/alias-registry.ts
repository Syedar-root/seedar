export class AliasRegistry {
  private tableCounter = 0;
  private colCounter = 0;
  private tableMap = new Map<string, string>();

  constructor(private pretty = false) {}

  nextTableAlias(base?: string): string {
    this.tableCounter++;
    if (this.pretty && base) {
      // sanitize base to simple token
      const token = base.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      return `${token}_t${this.tableCounter}`;
    }
    return `t${this.tableCounter}`;
  }

  nextColumnAlias(base?: string): string {
    this.colCounter++;
    if (this.pretty && base) {
      const token = base.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      return `${token}_c${this.colCounter}`;
    }
    return `c${this.colCounter}`;
  }

  ensureTableAlias(tableName: string, currentAlias?: string, hint?: string): string {
    if (currentAlias) return currentAlias;
    const alias = this.nextTableAlias(hint || tableName);
    this.tableMap.set(tableName, alias);
    return alias;
  }

  getTableAlias(tableName: string): string | undefined {
    return this.tableMap.get(tableName);
  }
}

