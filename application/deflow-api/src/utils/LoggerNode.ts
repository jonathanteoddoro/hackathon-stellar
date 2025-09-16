import { NodeMessage } from './NodeMessage';

export abstract class LoggerNode {
  abstract name: string;
  abstract description: string;

  abstract execute(message: NodeMessage);
}
