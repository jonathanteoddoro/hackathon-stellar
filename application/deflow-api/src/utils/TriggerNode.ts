import { NodeMessage } from './NodeMessage';

export abstract class TriggerNode {
  abstract name: string;
  abstract description: string;

  abstract validatePayload(payload: object): NodeMessage;
  abstract execute?(): Promise<NodeMessage>;
}
