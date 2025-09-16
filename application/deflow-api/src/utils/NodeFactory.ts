import { TriggerNode } from './TriggerNode';
import { ActionNode } from './ActionNode';
import { LoggerNode } from './LoggerNode';
import { NodeType } from './NodeType';

export type BaseNode = TriggerNode | ActionNode | LoggerNode;

type NodeConstructor<T extends BaseNode> = new (params: object) => T;
type NodeCategory = NodeType;

class NodeFactory {
  private static registry = new Map<string, NodeConstructor<BaseNode>>();
  private static categoryMap = new Map<string, NodeCategory>();

  // Registra um nó específico com identificador único
  static register<T extends BaseNode>(
    identifier: string,
    nodeClass: NodeConstructor<T>,
    category: NodeCategory,
  ): void {
    this.registry.set(identifier, nodeClass as NodeConstructor<BaseNode>);
    this.categoryMap.set(identifier, category);
  }

  static create(
    identifier: string,
    customParams: Record<string, any> = {},
  ): BaseNode | null {
    let NodeClass = this.registry.get(identifier);

    if (!NodeClass) {
      const lower = identifier.toLowerCase();
      for (const [key, cls] of this.registry.entries()) {
        if (key.toLowerCase() === lower) {
          NodeClass = cls;
          break;
        }
      }
    }

    if (!NodeClass) {
      const lower = identifier.toLowerCase();
      for (const [key, cls] of this.registry.entries()) {
        if (key.toLowerCase().endsWith(lower)) {
          NodeClass = cls;
          break;
        }
      }
    }

    if (!NodeClass) {
      console.error(
        `Nó '${identifier}' não encontrado no registry. Registrados: ${Array.from(
          this.registry.keys(),
        ).join(', ')}`,
      );
      return null;
    }

    return new NodeClass(customParams);
  }

  static getClass(identifier: string): NodeConstructor<BaseNode> | null {
    return this.registry.get(identifier) || null;
  }

  static getRegisteredNodes(): Array<{
    identifier: string;
    category: NodeCategory;
  }> {
    return Array.from(this.registry.keys()).map((identifier) => ({
      identifier,
      category: this.categoryMap.get(identifier)!,
    }));
  }

  static getNodesByCategory(category: NodeCategory): string[] {
    return Array.from(this.categoryMap.entries())
      .filter(([, cat]) => cat === category)
      .map(([identifier]) => identifier);
  }
}

export { NodeFactory, type NodeType, type NodeConstructor };
