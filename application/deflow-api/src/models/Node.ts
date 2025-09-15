import { NodeType } from '../utils/NodeType';

export class Node {
  id: string;
  x: number;
  y: number;
  successFlow: Node[];
  errorFlow?: Node[];
  type: NodeType;
  name: string;
  description: string;
  params: Record<string, string>;
  requiredInputPayloadKeysTypes: { [key: string]: string };
  outputPayloadKeysTypes: { [key: string]: string };
}
