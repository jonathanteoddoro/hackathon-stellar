import { NodeType } from '../utils/NodeType';

export class Node {
  id: string;
  x: number;
  y: number;
  outputs: Node[];
  type: NodeType;
  name: string;
  description: string;
  requiredInputPayloadKeysTypes: { [key: string]: string };
  outputPayloadKeysTypes: { [key: string]: string };
}
