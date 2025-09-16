import { NodeMessage } from './NodeMessage';

export enum ActionClassMap {
  TestClass,
}
export abstract class ActionNode {
  abstract name: string;
  abstract description: string;
  abstract execute(message: NodeMessage): Promise<NodeMessage>;
}
