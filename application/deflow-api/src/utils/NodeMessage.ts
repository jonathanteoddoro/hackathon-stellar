type NodeMessagePayload = {
  [key: string]: any;
  variables?: Record<string, string>;
};
export class NodeMessage {
  payload?: NodeMessagePayload;
  metadata?: { [key: string]: any };
}
