import type { ComponentType } from "react";
import type { CardTypeConfig, CardTypeRegistry, MetricCardProps } from "../types";

class CardRegistry {
  private registry: CardTypeRegistry = new Map();
  private defaultType: string = "default";

  register(type: string, config: CardTypeConfig): void {
    this.registry.set(type, config);
  }

  registerDefault(type: string, config: CardTypeConfig): void {
    this.register(type, config);
    this.defaultType = type;
  }

  get(type: string): CardTypeConfig | undefined {
    return this.registry.get(type);
  }

  getDefault(): CardTypeConfig {
    const config = this.registry.get(this.defaultType);
    if (!config) {
      throw new Error(`Default card type '${this.defaultType}' not registered`);
    }
    return config;
  }

  has(type: string): boolean {
    return this.registry.has(type);
  }

  getAllTypes(): string[] {
    return Array.from(this.registry.keys());
  }

  getComponent(type: string): ComponentType<MetricCardProps> {
    const config = this.get(type) || this.getDefault();
    return config.component;
  }

  getDefaultProps(type: string): Partial<MetricCardProps> {
    const config = this.get(type);
    return config?.defaultProps || {};
  }
}

export const cardRegistry = new CardRegistry();
