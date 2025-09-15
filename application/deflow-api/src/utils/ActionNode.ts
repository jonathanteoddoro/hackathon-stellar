export enum ActionClassMap {
  TestClass,
}
export abstract class ActionNode {
  abstract name: string;
  abstract description: string;
  abstract whenResolved(): void;
  abstract whenRejected(): void;
}
