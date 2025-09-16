import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mail,
  Shuffle,
  Plus,
  Minus,
  Webhook,
  LineChart,
  Database,
  MessageSquare,
  Filter,
  Wand2,
  Sigma,
  Bell,
  Send,
  Play,
  Eye,
  X,
  ChevronDown,
  Trash2,
  FolderPlus,
  Settings,
} from "lucide-react";
import DotPattern from "../components/dot-pattern";
import { NodeParameterForm } from "../components/NodeParameterForm";
import { NodeVariablesForm } from "../components/NodeVariablesForm";

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

// Three mocked nodes per category
// NodeType is string to allow dynamic node types fetched from an API (prefixed with `api_...`)
type NodeType = string;

type VarType = "string" | "number" | "boolean" | "object";

type CanvasNode = {
  id: string;
  type: string;
  x: number;
  y: number;
  name: string;
  description: string;
  params: Record<string, unknown>;
  variables: Record<string, string>;
  inputs: { id: string; name: string; type: VarType; value?: string }[];
  outputs: { id: string; name: string; type: VarType }[];
  flowNodeId?: string; // ID do nó no backend
  successFlow?: string[];
  errorFlow?: string[];
  requiredParamsPayloadKeysTypes?: Record<string, string>;
  outputPayloadKeysTypes?: Record<string, string>;
  predefinedNodeId?: string; // ID do nó predefinido
};

type PredefinedNode = {
  id: string;
  name: string;
  type: string;
  description: string;
  requiredParamsPayloadKeysTypes?: Record<string, string>;
  outputPayloadKeysTypes?: Record<string, string>;
};

type Flow = {
  id: string;
  name: string;
  description: string;
};

type Edge = {
  id: string;
  fromId: string;
  toId: string;
};

const SIDEBAR_WIDTH_PX = 320;

type NodeSpec = {
  width: number;
  height: number;
  className: string; // shape styles
  icon: typeof Mail;
  label: string;
  category: "Trigger" | "Logger" | "Operations" | "Action";
  canStartConnection: boolean; // base capability
  canReceiveConnection: boolean;
};

const CATEGORY_BG_CLASSES: Record<
  NodeSpec["category"],
  { enabled: string; disabled: string }
> = {
  Trigger: {
    enabled: "bg-[#9873FF]/15 hover:bg-[#9873FF]/25",
    disabled: "bg-[#9873FF]/10",
  },
  Logger: {
    enabled: "bg-[#22D3EE]/15 hover:bg-[#22D3EE]/25",
    disabled: "bg-[#22D3EE]/10",
  },
  Operations: {
    enabled: "bg-[#10B981]/15 hover:bg-[#10B981]/25",
    disabled: "bg-[#10B981]/10",
  },
  Action: {
    enabled: "bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25",
    disabled: "bg-[#F59E0B]/10",
  },
};

const CATEGORY_NODE_BG_CLASS: Record<NodeSpec["category"], string> = {
  Trigger: "bg-[#9873FF]/15",
  Logger: "bg-[#22D3EE]/15",
  Operations: "bg-[#10B981]/15",
  Action: "bg-[#F59E0B]/15",
};

// Allow registering dynamic specs (e.g. from API) by keying this record with strings.
const NODE_SPECS: Record<string, NodeSpec> = {
  // Triggers
  swap: {
    width: 180,
    height: 140,
    className:
      "rounded-l-2xl rounded-r-xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Shuffle,
    label: "SWAP",
    category: "Trigger",
    canStartConnection: true,
    canReceiveConnection: false,
  },
  webhook_in: {
    width: 180,
    height: 140,
    className:
      "rounded-l-2xl rounded-r-xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Webhook,
    label: "WEBHOOK IN",
    category: "Trigger",
    canStartConnection: true,
    canReceiveConnection: false,
  },
  price_feed: {
    width: 180,
    height: 140,
    className:
      "rounded-l-2xl rounded-r-xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: LineChart,
    label: "PRICE FEED",
    category: "Trigger",
    canStartConnection: true,
    canReceiveConnection: false,
  },
  email: {
    width: 180,
    height: 110,
    className:
      "rounded-xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Mail,
    label: "EMAIL",
    category: "Logger",
    canStartConnection: false,
    canReceiveConnection: true,
  },
  logger_db: {
    width: 180,
    height: 110,
    className:
      "rounded-xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Database,
    label: "DB LOGGER",
    category: "Logger",
    canStartConnection: false,
    canReceiveConnection: true,
  },
  logger_chat: {
    width: 180,
    height: 110,
    className:
      "rounded-xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: MessageSquare,
    label: "CHAT LOGGER",
    category: "Logger",
    canStartConnection: false,
    canReceiveConnection: true,
  },
  // Operations
  filter: {
    width: 160,
    height: 140,
    className:
      "rounded-2xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Filter,
    label: "FILTER",
    category: "Operations",
    canStartConnection: true,
    canReceiveConnection: true,
  },
  transform: {
    width: 160,
    height: 140,
    className:
      "rounded-2xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Wand2,
    label: "TRANSFORM",
    category: "Operations",
    canStartConnection: true,
    canReceiveConnection: true,
  },
  aggregate: {
    width: 160,
    height: 140,
    className:
      "rounded-2xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Sigma,
    label: "AGGREGATE",
    category: "Operations",
    canStartConnection: true,
    canReceiveConnection: true,
  },
  // Actions
  notify: {
    width: 150,
    height: 140,
    className:
      "rounded-full bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Bell,
    label: "NOTIFY",
    category: "Action",
    canStartConnection: true,
    canReceiveConnection: true,
  },
  execute: {
    width: 150,
    height: 140,
    className:
      "rounded-full bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Play,
    label: "EXECUTE",
    category: "Action",
    canStartConnection: true,
    canReceiveConnection: true,
  },
  webhook_out: {
    width: 150,
    height: 140,
    className:
      "rounded-full bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Send,
    label: "WEBHOOK OUT",
    category: "Action",
    canStartConnection: true,
    canReceiveConnection: true,
  },
};

function SidebarCard({
  label,
  icon: Icon,
  nodeType,
  disabled,
  square,
  category,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  nodeType: string;
  disabled?: boolean;
  square?: boolean;
  category?: NodeSpec["category"];
}) {
  const spec = NODE_SPECS[nodeType];
  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    // store the node key (can be dynamic like `api_<id>`)
    e.dataTransfer.setData("application/x-node-type", nodeType);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable={!disabled}
      onDragStart={handleDragStart}
      className={`${
        square
          ? "h-24 p-2 grid place-items-center"
          : "flex items-center gap-3 px-4 py-3"
      } rounded-lg border border-white/10 select-none ${
        disabled
          ? category
            ? `${CATEGORY_BG_CLASSES[category].disabled} opacity-60 cursor-not-allowed`
            : "bg-[#1a1a1a]/50 opacity-60 cursor-not-allowed"
          : category
          ? `${CATEGORY_BG_CLASSES[category].enabled} cursor-grab active:cursor-grabbing`
          : "bg-[#1a1a1a] hover:bg-[#232323] cursor-grab active:cursor-grabbing"
      }`}
    >
      {square ? (
        <div className="flex flex-col items-center justify-center gap-1 w-full h-full p-2">
          <div className="grid place-items-center w-10 h-10 rounded-lg border border-white/10 bg-black/60 flex-shrink-0">
            <Icon className="w-5 h-5 text-white/90" />
          </div>
          <span className="text-[9px] leading-[1.1] tracking-wide font-medium text-white/90 text-center w-full overflow-hidden break-words hyphens-auto max-h-6">
            {label}
          </span>
        </div>
      ) : (
        <>
          <div className="grid place-items-center h-10 rounded-lg border border-white/10 bg-black/60 flex-shrink-0 text-wrap">
            <Icon className="w-5 h-5 text-white/90" />
          </div>
          <span className="tracking-wide font-medium truncate max-w-[10rem] text-sm">
            {label}
          </span>
        </>
      )}
    </div>
  );
}

function NodeBox({
  node,
  onRemove,
  onViewDetails,
  onStartDrag,
}: {
  node: CanvasNode;
  onRemove: (id: string) => Promise<void> | void;
  onViewDetails: (node: CanvasNode) => void;
  onStartDrag: (id: string, e: React.MouseEvent) => void;
}) {
  const spec = NODE_SPECS[node.type];
  const Icon = spec.icon;

  // Determine if node is configured based on API properties
  const isConfigured = node.params && Object.keys(node.params).length > 0;
  const hasVariables = node.variables && Object.keys(node.variables).length > 0;
  const hasRequiredParams =
    node.requiredParamsPayloadKeysTypes &&
    Object.keys(node.requiredParamsPayloadKeysTypes).length > 0;

  return (
    <div
      className="absolute"
      style={{
        left: node.x,
        top: node.y,
        width: spec.width,
        height: spec.height,
      }}
      onMouseDown={(e) => onStartDrag(node.id, e)}
    >
      <div
        className={`${spec.className} ${
          CATEGORY_NODE_BG_CLASS[spec.category]
        } w-full h-full relative overflow-hidden border-2 transition-all duration-200 ${
          isConfigured ? "border-green-400/50" : "border-white/10"
        }`}
      >
        {/* Status indicators */}
        <div className="absolute top-1 left-1 flex gap-1">
          {isConfigured && (
            <div
              className="w-2 h-2 bg-green-400 rounded-full"
              title="Configured"
            />
          )}
          {hasVariables && (
            <div
              className="w-2 h-2 bg-blue-400 rounded-full"
              title="Has Variables"
            />
          )}
          {hasRequiredParams && (
            <div
              className="w-2 h-2 bg-yellow-400 rounded-full"
              title="Has Required Parameters"
            />
          )}
        </div>

        <button
          onClick={() => onRemove(node.id)}
          className="absolute top-1 right-8 w-6 h-6 grid place-items-center rounded-md bg-red-500/80 hover:bg-red-500 text-white transition-colors"
          title="Remove"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewDetails(node)}
          className="absolute top-1 right-1 w-6 h-6 grid place-items-center rounded-md bg-white/90 hover:bg-white text-black transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>

        <div className="w-full h-full flex flex-col items-center justify-center text-white/85 tracking-wider p-3 box-border">
          <div className="flex flex-col items-center gap-1.5 max-w-full">
            <div
              className={`grid place-items-center w-10 h-10 rounded-lg transition-all duration-200 ${
                isConfigured
                  ? "bg-green-400/20 border border-green-400/30"
                  : "bg-black/50 border border-white/10"
              }`}
            >
              <Icon className="w-6 h-6" />
            </div>

            <div className="text-center space-y-0.5">
              <span className="text-xs font-bold block max-w-[160px] leading-tight line-clamp-2 overflow-hidden text-ellipsis">
                {node.name || spec.label}
              </span>

              <div className="text-xs text-white/50 font-medium">
                {spec.category}
              </div>
            </div>

            {/* API-specific status indicators */}
            <div className="flex flex-wrap gap-1 justify-center mt-1">
              {isConfigured && (
                <span className="text-xs bg-green-400/20 text-green-300 px-1.5 py-0.5 rounded-full border border-green-400/30">
                  Config
                </span>
              )}

              {hasRequiredParams && !isConfigured && (
                <span className="text-xs bg-yellow-400/20 text-yellow-300 px-1.5 py-0.5 rounded-full border border-yellow-400/30">
                  Setup
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Feature = () => {
  // Flow management state
  const [flows, setFlows] = useState<Flow[]>([]);
  const [currentFlow, setCurrentFlow] = useState<Flow | null>(null);
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [newFlowForm, setNewFlowForm] = useState({ name: "", description: "" });

  // Canvas state (per flow)
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  console.log("Current nodes:", nodes);
  const [edges, setEdges] = useState<Edge[]>([]);
  // track used node types (supports dynamic api_ keys)
  const [usedTypes, setUsedTypes] = useState<Record<string, boolean>>({});
  const [dragConnection, setDragConnection] = useState<{
    fromId: string;
    start: { x: number; y: number };
    current: { x: number; y: number };
  } | null>(null);
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [editingParams, setEditingParams] = useState<Record<string, unknown>>(
    {}
  );
  const [editingVariables, setEditingVariables] = useState<
    Record<string, string>
  >({});
  const [openSections, setOpenSections] = useState<{
    Trigger: boolean;
    Logger: boolean;
    Operations: boolean;
    Action: boolean;
  }>({
    Trigger: false,
    Logger: false,
    Operations: false,
    Action: false,
  });
  type ApiNode = {
    name: string;
    id: string;
    type: string;
    description?: string;
  };
  const [apiNodes, setApiNodes] = useState<ApiNode[]>([]);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [dragNode, setDragNode] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [zoom, setZoom] = useState<number>(0.85);

  // Function to fetch predefined node data and populate inputs/outputs
  const loadPredefinedNodeDataRef =
    useRef<(node: CanvasNode) => Promise<CanvasNode>>();

  loadPredefinedNodeDataRef.current = async (
    node: CanvasNode
  ): Promise<CanvasNode> => {
    if (!node.predefinedNodeId) {
      return node;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/predefined-nodes/${node.predefinedNodeId}`
      );
      if (response.ok) {
        const predefinedNode: PredefinedNode = await response.json();

        // Create inputs from required parameters
        const inputs = predefinedNode.requiredParamsPayloadKeysTypes
          ? Object.entries(predefinedNode.requiredParamsPayloadKeysTypes).map(
              ([key, type]) => ({
                id: `input-${key}`,
                name: key,
                type: type as VarType,
                value: undefined,
              })
            )
          : [];

        // Create outputs: default output + custom variables
        const outputs = [];

        // Add default output payload
        if (predefinedNode.outputPayloadKeysTypes) {
          Object.entries(predefinedNode.outputPayloadKeysTypes).forEach(
            ([key, type]) => {
              outputs.push({
                id: `output-${key}`,
                name: key,
                type: type as VarType,
              });
            }
          );
        }

        // Add custom variables in the specified format
        if (node.variables && Object.keys(node.variables).length > 0) {
          outputs.push({
            id: "output-variables",
            name: "variables",
            type: "object" as VarType,
          });
        }

        return {
          ...node,
          inputs,
          outputs,
          requiredParamsPayloadKeysTypes:
            predefinedNode.requiredParamsPayloadKeysTypes,
          outputPayloadKeysTypes: predefinedNode.outputPayloadKeysTypes,
        };
      }
    } catch (error) {
      console.error("Failed to fetch predefined node data:", error);
    }

    return node;
  };

  const loadPredefinedNodeData = useCallback(
    (node: CanvasNode): Promise<CanvasNode> => {
      return loadPredefinedNodeDataRef.current!(node);
    },
    []
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const type = e.dataTransfer.getData(
        "application/x-node-type"
      ) as NodeType;
      if (!type) return;

      // Require flow selection
      if (!currentFlow) {
        alert("Please select or create a flow first");
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const spec = NODE_SPECS[type];
      const x = (e.clientX - rect.left) / zoom - spec.width / 2;
      const y = (e.clientY - rect.top) / zoom - spec.height / 2;

      // Allow multiple nodes of the same type
      // Removed: if (usedTypes[type]) return;

      // Find the API node definition if it's an API node
      const apiNode = type.startsWith("api_")
        ? apiNodes.find((n) => `api_${n.name.toLowerCase()}` === type)
        : null;

      const newNode: CanvasNode = {
        id: `${Date.now()}-${nodes.length}`,
        type,
        x,
        y,
        name: apiNode?.name || spec.label,
        description:
          apiNode?.description || `Auto-generated ${spec.label} node`,
        params: {},
        variables: {},
        inputs: [],
        outputs: [],
        predefinedNodeId: apiNode?.id, // Add predefinedNodeId here
        requiredParamsPayloadKeysTypes: apiNode ? {} : undefined,
        outputPayloadKeysTypes: apiNode ? {} : undefined,
      };

      // If it's an API node, save to backend
      if (type.startsWith("api_") && apiNode) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/flow/${currentFlow.id}/new-node`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                predefinedNodeId: apiNode.id,
                name: apiNode.name,
                type: apiNode.type,
                description: apiNode.description,
                params: "{}",
                x: Math.round(x),
                y: Math.round(y),
                variables: "{}",
              }),
            }
          );

          if (response.ok) {
            const createdNode = await response.json();
            newNode.flowNodeId = createdNode.id;
            // Update with backend response data
            newNode.params = createdNode.params || {};
            newNode.variables = createdNode.variables || {};
            newNode.predefinedNodeId = createdNode.predefinedNodeId; // Ensure predefinedNodeId is set
          }
        } catch (error) {
          console.error("Failed to save node to backend:", error);
        }
      }

      // Load predefined node data if available
      setNodes((prev) => [...prev, newNode]);

      // Load predefined data after adding to state
      if (newNode.predefinedNodeId) {
        setTimeout(async () => {
          const nodeWithData = await loadPredefinedNodeData(newNode);
          setNodes((prevNodes) =>
            prevNodes.map((n) => (n.id === newNode.id ? nodeWithData : n))
          );
        }, 0);
      }
      // No longer tracking usedTypes since we allow multiple nodes of same type
    },
    [zoom, nodes.length, currentFlow, apiNodes, loadPredefinedNodeData]
  );

  // Flow management functions
  const loadFlows = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/flow`);
      if (response.ok) {
        const data = await response.json();
        setFlows(data);
      }
    } catch (error) {
      console.warn("Failed to fetch flows", error);
    }
  }, []);

  const createFlow = useCallback(async () => {
    if (!newFlowForm.name.trim() || !newFlowForm.description.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/flow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFlowForm.name.trim(),
          description: newFlowForm.description.trim(),
        }),
      });

      if (response.ok) {
        const flow = await response.json();
        setFlows((prev) => [...prev, flow]);
        setCurrentFlow(flow);
        setShowCreateFlow(false);
        setNewFlowForm({ name: "", description: "" });
        // Clear canvas for new flow
        setNodes([]);
        setEdges([]);
        setUsedTypes({});
      }
    } catch (error) {
      console.error("Failed to create flow:", error);
    }
  }, [newFlowForm]);

  // Function to update outputs when variables change
  const updateNodeOutputs = useCallback(
    (node: CanvasNode, newVariables: Record<string, string>): CanvasNode => {
      const outputs = [];

      // Add default output payload (keep existing outputs that are not variables)
      if (node.outputs) {
        outputs.push(
          ...node.outputs.filter((output) => output.id !== "output-variables")
        );
      }

      // Add custom variables in the specified format
      if (newVariables && Object.keys(newVariables).length > 0) {
        outputs.push({
          id: "output-variables",
          name: "variables",
          type: "object" as VarType,
        });
      }

      return {
        ...node,
        outputs,
        variables: newVariables,
      };
    },
    []
  );

  const switchFlow = useCallback(
    async (flow: Flow) => {
      setCurrentFlow(flow);

      try {
        // Load specific flow with its nodes
        const response = await fetch(`${API_BASE_URL}/flow/${flow.id}`);
        if (response.ok) {
          const flowData = await response.json();

          // Clear existing state
          setNodes([]);
          setEdges([]);
          setUsedTypes({});

          // Convert backend nodes to canvas nodes
          if (flowData.nodes && flowData.nodes.length > 0) {
            const canvasNodes: CanvasNode[] = flowData.nodes.map(
              (backendNode: {
                id: string;
                name: string;
                description: string;
                params?: string;
                variables?: string;
                x: number;
                y: number;
                type: string;
                predefinedNodeId?: string;
                successFlow?: Array<{ id: string }>;
                errorFlow?: Array<{ id: string }>;
              }) => {
                // Map the backend type to our node type format
                const nodeType = backendNode.type
                  ? `api_${backendNode.name.toLowerCase()}`
                  : "unknown";

                return {
                  id: `node-${backendNode.id}`,
                  type: nodeType,
                  x: backendNode.x || 0,
                  y: backendNode.y || 0,
                  name: backendNode.name || "Unknown",
                  description: backendNode.description || "",
                  params: backendNode.params,
                  variables: backendNode.variables,
                  inputs: [],
                  outputs: [],
                  flowNodeId: backendNode.id,
                  predefinedNodeId: backendNode.predefinedNodeId,
                  successFlow:
                    backendNode.successFlow?.map((sf) => sf.id) || [],
                  errorFlow: backendNode.errorFlow?.map((ef) => ef.id) || [],
                  requiredParamsPayloadKeysTypes: {},
                  outputPayloadKeysTypes: {},
                };
              }
            );

            // Load predefined node data for all nodes to populate inputs/outputs
            const nodesWithData = await Promise.all(
              canvasNodes.map(async (node) => {
                const loadedNode = await loadPredefinedNodeData(node);
                return loadedNode;
              })
            );

            setNodes(nodesWithData);

            // Clear usedTypes since we allow multiple nodes of same type
            setUsedTypes({});

            // Convert successFlow connections to edges
            const canvasEdges: Edge[] = [];
            canvasNodes.forEach((node) => {
              if (node.successFlow && node.successFlow.length > 0) {
                node.successFlow.forEach((targetNodeId, index) => {
                  const targetNode = canvasNodes.find(
                    (n) => n.flowNodeId === targetNodeId
                  );
                  if (targetNode) {
                    canvasEdges.push({
                      id: `edge-${node.flowNodeId}-${targetNodeId}-${index}`,
                      fromId: node.id,
                      toId: targetNode.id,
                    });
                  }
                });
              }
            });

            setEdges(canvasEdges);
          }
        } else {
          console.error("Failed to load flow data");
          // Clear canvas if failed to load
          setNodes([]);
          setEdges([]);
          setUsedTypes({});
        }
      } catch (error) {
        console.error("Failed to fetch flow data:", error);
        // Clear canvas on error
        setNodes([]);
        setEdges([]);
        setUsedTypes({});
      }
    },
    [loadPredefinedNodeData]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // Helpers to compute handle centers
  const getSourcePoint = useCallback((n: CanvasNode) => {
    const s = NODE_SPECS[n.type];
    return { x: n.x + s.width, y: n.y + s.height / 2 };
  }, []);
  const getTargetPoint = useCallback((n: CanvasNode) => {
    const s = NODE_SPECS[n.type];
    return { x: n.x, y: n.y + s.height / 2 };
  }, []);

  const countIncoming = useCallback(
    (nodeId: string) => edges.filter((e) => e.toId === nodeId).length,
    [edges]
  );
  const countOutgoing = useCallback(
    (nodeId: string) => edges.filter((e) => e.fromId === nodeId).length,
    [edges]
  );

  const canNodeStartNow = useCallback((node: CanvasNode) => {
    const spec = NODE_SPECS[node.type];
    if (!spec.canStartConnection) return false;
    // Allow multiple outgoing connections for all node types
    if (spec.category === "Trigger") return true; // can have multiple outputs
    if (spec.category === "Operations") return true; // can always start
    if (spec.category === "Action") return true; // same as operations
    return false;
  }, []);

  const canNodeReceiveNow = useCallback(
    (node: CanvasNode) => {
      const spec = NODE_SPECS[node.type];
      if (!spec.canReceiveConnection) return false;
      if (spec.category === "Operations" || spec.category === "Action")
        return true; // can always receive
      // Logger: single incoming
      return countIncoming(node.id) === 0;
    },
    [countIncoming]
  );

  const onStartConnect = useCallback(
    (fromId: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      const n = nodes.find((x) => x.id === fromId);
      if (!n) return;
      if (!canNodeStartNow(n)) return;
      const start = getSourcePoint(n);
      setDragConnection({ fromId, start, current: start });
    },
    [nodes, getSourcePoint, canNodeStartNow]
  );

  const onMouseMoveCanvas = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (dragConnection) {
        setDragConnection((prev) =>
          prev
            ? {
                ...prev,
                current: {
                  x: (e.clientX - rect.left) / zoom,
                  y: (e.clientY - rect.top) / zoom,
                },
              }
            : prev
        );
      }

      if (dragNode) {
        const { id, offsetX, offsetY } = dragNode;
        const newX = (e.clientX - rect.left) / zoom - offsetX;
        const newY = (e.clientY - rect.top) / zoom - offsetY;
        setNodes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, x: newX, y: newY } : n))
        );
      }
      // variable drag logic removed
    },
    [dragConnection, dragNode, zoom]
  );

  const onCompleteConnect = useCallback(
    (toId: string) => async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!dragConnection) return;
      if (dragConnection.fromId === toId) {
        setDragConnection(null);
        return;
      }
      const toNode = nodes.find((n) => n.id === toId);
      if (!toNode) return setDragConnection(null);
      if (!canNodeReceiveNow(toNode)) {
        setDragConnection(null);
        return;
      }

      // Check if connection already exists
      if (
        edges.some((e) => e.fromId === dragConnection.fromId && e.toId === toId)
      ) {
        setDragConnection(null);
        return;
      }

      const fromNode = nodes.find((n) => n.id === dragConnection.fromId);

      // Create edge locally first
      const newEdge = {
        id: `${dragConnection.fromId}->${toId}-${Date.now()}`,
        fromId: dragConnection.fromId,
        toId,
      };
      setEdges((prev) => [...prev, newEdge]);
      setDragConnection(null);

      // If both nodes have flowNodeId, sync with backend
      if (fromNode?.flowNodeId && toNode?.flowNodeId && currentFlow) {
        try {
          await fetch(`${API_BASE_URL}/flow/link-nodes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromNodeId: fromNode.flowNodeId,
              toNodeId: toNode.flowNodeId,
              isForErrorFlow: false,
            }),
          });
        } catch (error) {
          console.error("Failed to link nodes in backend:", error);
          // Optionally revert the local change
          setEdges((prev) => prev.filter((e) => e.id !== newEdge.id));
        }
      }
    },
    [dragConnection, canNodeReceiveNow, nodes, edges, currentFlow]
  );

  const handleViewDetails = useCallback(
    async (node: CanvasNode) => {
      // Load predefined node data to populate inputs/outputs
      const nodeWithData = await loadPredefinedNodeData(node);
      setSelectedNode(nodeWithData);
      setEditingParams(nodeWithData.params || {});
      setEditingVariables(nodeWithData.variables || {});
    },
    [loadPredefinedNodeData]
  );

  const onStartDragNode = useCallback(
    (id: string, e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button")) return; // ignore drags starting from buttons/handles
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const node = nodes.find((n) => n.id === id);
      if (!node) return;
      const offsetX = (e.clientX - rect.left) / zoom - node.x;
      const offsetY = (e.clientY - rect.top) / zoom - node.y;
      setDragNode({ id, offsetX, offsetY });
    },
    [nodes, zoom]
  );

  const onWheelCanvas = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom((z) => {
      const next = e.deltaY > 0 ? z * 0.95 : z * 1.05;
      return Math.max(0.5, Math.min(2, Number(next.toFixed(3))));
    });
  }, []);

  const onCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // If we're dragging a connection and click on empty space, cancel it
      if (dragConnection) {
        const target = e.target as HTMLElement;
        // Only cancel if clicking on the canvas itself, not on nodes or buttons
        if (
          target === canvasRef.current ||
          target.closest(".canvas-background")
        ) {
          setDragConnection(null);
        }
      }
    },
    [dragConnection]
  );

  // Fetch flows from API
  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  // Fetch nodes from local API and register them into NODE_SPECS dynamically
  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE_URL}/predefined-nodes`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setApiNodes(data);
        (data as ApiNode[]).forEach((n: ApiNode) => {
          const key = `api_${n.name.toLowerCase()}`;
          // don't overwrite existing built-ins
          if (NODE_SPECS[key]) return;
          // map category to our categories (normalize)
          const t = (n.type || "").toLowerCase();
          console.log(n.type);
          const category: NodeSpec["category"] =
            t === "logger"
              ? "Logger"
              : t === "trigger"
              ? "Trigger"
              : t === "operations"
              ? "Operations"
              : "Action";
          NODE_SPECS[key] = {
            width: 180,
            height:
              category === "Trigger" ? 140 : category === "Action" ? 150 : 110,
            className: NODE_SPECS["swap"].className,
            icon: Mail,
            label: n.name.toUpperCase(),
            category,
            canStartConnection:
              category === "Trigger" ||
              category === "Operations" ||
              category === "Action",
            canReceiveConnection:
              category === "Logger" ? true : category !== "Trigger",
          } as NodeSpec;
        });
      })
      .catch((e) => {
        // fail silently; keep built-in nodes
        // console.warn('Failed to fetch nodes', e);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // variable removal logic removed (no standalone variables)

  return (
    <div className="min-h-screen relative text-foreground flex">
      {/* Dot Pattern Background (dark) */}
      <DotPattern className="absolute inset-0 -z-10" dotColor="#1f1f1f" />
      {/* Sidebar */}
      <aside
        className="h-screen sticky top-0"
        style={{ width: SIDEBAR_WIDTH_PX }}
      >
        <div className="h-full border-r border-white/10 bg-black/80 flex flex-col">
          <div className="flex items-center gap-3 px-6 py-6">
            <img src="/DeflowLogo.png" alt="Deflow" className="h-8 w-auto" />
            <span className="text-lg font-semibold tracking-tight">Deflow</span>
          </div>

          {/* Flow Management Section */}
          <div className="border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center justify-between px-6 mb-3">
              <span className="text-sm font-medium text-white/90">Flows</span>
              <button
                onClick={() => setShowCreateFlow(true)}
                className="w-8 h-8 grid place-items-center rounded-md bg-white/10 hover:bg-white/20 text-white"
                title="Create Flow"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>

            {currentFlow ? (
              <div className="px-6">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {currentFlow.name}
                      </div>
                      <div className="text-xs text-white/60 truncate">
                        {currentFlow.description}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(
                              `${API_BASE_URL}/flow/${currentFlow.id}/deploy`,
                              {
                                method: "POST",
                              }
                            );
                            if (response.ok) {
                              alert("Flow deployed successfully!");
                            } else {
                              alert("Failed to deploy flow");
                            }
                          } catch (error) {
                            console.error("Failed to deploy flow:", error);
                            alert("Failed to deploy flow");
                          }
                        }}
                        className="w-6 h-6 grid place-items-center rounded hover:bg-green-500/20 text-green-400"
                        title="Deploy Flow"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentFlow(null)}
                        className="w-6 h-6 grid place-items-center rounded hover:bg-white/10"
                        title="Switch Flow"
                      >
                        <Settings className="w-4 h-4 text-white/70" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-6">
                {flows.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs text-white/70 mb-2">
                      Available Flows
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {flows.map((flow) => (
                        <button
                          key={flow.id}
                          onClick={() => switchFlow(flow)}
                          className="w-full text-left p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
                        >
                          <div className="text-sm font-medium text-white truncate">
                            {flow.name}
                          </div>
                          <div className="text-xs text-white/60 truncate">
                            {flow.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-white/50 text-center py-2">
                    No flows available
                  </div>
                )}
                <button
                  onClick={() => setShowCreateFlow(true)}
                  className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white mt-3"
                >
                  Create New Flow
                </button>
              </div>
            )}
          </div>

          <div
            className="flex-1 overflow-y-scroll sidebar-scroll"
            style={{ scrollbarGutter: "stable" }}
          >
            {/* Trigger */}
            <button
              className="w-full px-6 py-3 text-sm text-white/80 flex items-center justify-between hover:bg-white/5"
              onClick={() =>
                setOpenSections((s) => ({ ...s, Trigger: !s.Trigger }))
              }
            >
              <span>Trigger</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  openSections.Trigger ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
            {openSections.Trigger && (
              <div className="px-6 mb-4 mt-2 flex gap-2 flex-wrap">
                {apiNodes.filter((n) => n.type.toLowerCase() === "trigger")
                  .length > 0 ? (
                  apiNodes
                    .filter((n) => n.type.toLowerCase() === "trigger")
                    .map((n) => (
                      <SidebarCard
                        key={`api_${n.id}`}
                        square
                        category="Trigger"
                        label={n.name}
                        icon={Shuffle}
                        nodeType={`api_${n.name.toLowerCase()}`}
                      />
                    ))
                ) : (
                  <p className="text-xs text-white/50 col-span-3">
                    No triggers available
                  </p>
                )}
              </div>
            )}

            {/* Logger */}
            <button
              className="w-full px-6 py-3 text-sm text-white/80 flex items-center justify-between hover:bg-white/5"
              onClick={() =>
                setOpenSections((s) => ({ ...s, Logger: !s.Logger }))
              }
            >
              <span>Logger</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  openSections.Logger ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
            {openSections.Logger && (
              <div className="px-6 mb-4 mt-2 flex gap-2 flex-wrap">
                {apiNodes.filter((n) => n.type.toLowerCase() === "logger")
                  .length > 0 ? (
                  apiNodes
                    .filter((n) => n.type.toLowerCase() === "logger")
                    .map((n) => (
                      <SidebarCard
                        key={`api_${n.id}`}
                        square
                        category="Logger"
                        label={n.name}
                        icon={Mail}
                        nodeType={`api_${n.name.toLowerCase()}`}
                      />
                    ))
                ) : (
                  <p className="text-xs text-white/50 col-span-3">
                    No loggers available
                  </p>
                )}
              </div>
            )}

            {/* Action */}
            <button
              className="w-full px-6 py-3 text-sm text-white/80 flex items-center justify-between hover:bg-white/5"
              onClick={() =>
                setOpenSections((s) => ({ ...s, Action: !s.Action }))
              }
            >
              <span>Action</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  openSections.Action ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
            {openSections.Action && (
              <div className="px-6 mb-6 mt-2 flex gap-2 flex-wrap">
                {apiNodes.filter((n) => n.type.toLowerCase() === "action")
                  .length > 0 ? (
                  apiNodes
                    .filter((n) => n.type.toLowerCase() === "action")
                    .map((n) => (
                      <SidebarCard
                        key={`api_${n.id}`}
                        square
                        category="Action"
                        label={n.name}
                        icon={Bell}
                        nodeType={`api_${n.name.toLowerCase()}`}
                      />
                    ))
                ) : (
                  <p className="text-xs text-white/50 col-span-3">
                    No actions available
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Canvas */}
      <main className="flex-1 relative">
        {/* Zoom Controls */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 text-white"
            onClick={() =>
              setZoom((z) => Math.max(0.5, Number((z * 0.9).toFixed(3))))
            }
          >
            -
          </button>
          <span className="text-sm tabular-nums bg-white/5 rounded px-2 py-1">
            {Math.round(zoom * 100)}%
          </span>
          <button
            className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 text-white"
            onClick={() =>
              setZoom((z) => Math.min(2, Number((z * 1.1).toFixed(3))))
            }
          >
            +
          </button>
          <button
            className="h-8 px-2 rounded-md bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setZoom(0.85)}
          >
            Reset
          </button>
        </div>
        <div
          ref={canvasRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onMouseMove={onMouseMoveCanvas}
          onMouseUp={() => {
            setDragNode(null);
          }}
          onWheel={onWheelCanvas}
          onClick={onCanvasClick}
          className="h-screen w-full relative overflow-hidden canvas-background"
        >
          <div
            className="absolute inset-0 origin-top-left"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* SVG Edges */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              shapeRendering="geometricPrecision"
              style={{ overflow: "visible" }}
            >
              {edges.map((e) => {
                const from = nodes.find((n) => n.id === e.fromId);
                const to = nodes.find((n) => n.id === e.toId);
                if (!from || !to) return null;
                const p1 = getSourcePoint(from);
                const p2 = getTargetPoint(to);

                // Calculate control point for smooth curve
                const distance = Math.abs(p2.x - p1.x);
                const controlOffset = Math.min(distance * 0.5, 100);
                const cp1x = p1.x + controlOffset;
                const cp1y = p1.y;
                const cp2x = p2.x - controlOffset;
                const cp2y = p2.y;

                return (
                  <g key={e.id}>
                    <path
                      d={`M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`}
                      stroke="white"
                      strokeOpacity="0.85"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    {/* Invisible clickable path for easier interaction */}
                    <path
                      d={`M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`}
                      stroke="transparent"
                      strokeWidth="10"
                      fill="none"
                      style={{ cursor: "pointer" }}
                      className="pointer-events-auto"
                      onClick={async (event) => {
                        event.stopPropagation();
                        if (window.confirm("Remove this connection?")) {
                          const edgeToRemove = e;
                          const fromNode = nodes.find(
                            (n) => n.id === edgeToRemove.fromId
                          );
                          const toNode = nodes.find(
                            (n) => n.id === edgeToRemove.toId
                          );

                          // Remove from UI immediately
                          setEdges((prev) =>
                            prev.filter((edge) => edge.id !== edgeToRemove.id)
                          );

                          // If both nodes have flowNodeId, sync with backend
                          if (
                            fromNode?.flowNodeId &&
                            toNode?.flowNodeId &&
                            currentFlow
                          ) {
                            try {
                              await fetch(`${API_BASE_URL}/flow/unlink-nodes`, {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  fromNodeId: fromNode.flowNodeId,
                                  toNodeId: toNode.flowNodeId,
                                  isForErrorFlow: false,
                                }),
                              });
                            } catch (error) {
                              console.error(
                                "Failed to unlink nodes in backend:",
                                error
                              );
                              // Optionally revert the local change
                              setEdges((prev) => [...prev, edgeToRemove]);
                            }
                          }
                        }
                      }}
                    />
                  </g>
                );
              })}
              {dragConnection && (
                <path
                  d={`M ${dragConnection.start.x} ${dragConnection.start.y} C ${
                    dragConnection.start.x + 50
                  } ${dragConnection.start.y}, ${
                    dragConnection.current.x - 50
                  } ${dragConnection.current.y}, ${dragConnection.current.x} ${
                    dragConnection.current.y
                  }`}
                  stroke="white"
                  strokeOpacity="0.85"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              )}
            </svg>

            {nodes.map((n) => (
              <div key={n.id}>
                <NodeBox
                  node={n}
                  onRemove={async (id) => {
                    const nodeToRemove = nodes.find((n) => n.id === id);

                    // Remove from UI immediately
                    setNodes((prev) => prev.filter((x) => x.id !== id));
                    setEdges((prev) =>
                      prev.filter((e) => e.fromId !== id && e.toId !== id)
                    );
                    // No longer need to track usedTypes since we allow multiple nodes

                    // If node has flowNodeId and we have a current flow, sync with backend
                    if (nodeToRemove?.flowNodeId && currentFlow) {
                      try {
                        await fetch(
                          `${API_BASE_URL}/flow/${currentFlow.id}/node/${nodeToRemove.flowNodeId}`,
                          {
                            method: "DELETE",
                          }
                        );
                      } catch (error) {
                        console.error(
                          "Failed to delete node from backend:",
                          error
                        );
                        // Optionally revert the local change by re-adding the node
                        // setNodes((prev) => [...prev, nodeToRemove]);
                      }
                    }
                  }}
                  onViewDetails={handleViewDetails}
                  onStartDrag={onStartDragNode}
                />
                {/* Source handle (plus) on right side if node can start now */}
                {canNodeStartNow(n) && (
                  <button
                    onMouseDown={onStartConnect(n.id)}
                    className="absolute grid place-items-center w-6 h-6 rounded-md bg-white text-black shadow"
                    style={{
                      left: n.x + NODE_SPECS[n.type].width - 12,
                      top: n.y + NODE_SPECS[n.type].height / 2 - 12,
                    }}
                    title="Connect"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                {/* Target handle (hollow circle) when node can receive */}
                {canNodeReceiveNow(n) && (
                  <button
                    onMouseUp={onCompleteConnect(n.id)}
                    className="absolute grid place-items-center w-6 h-6 rounded-full border-2 border-white/80 bg-transparent"
                    style={{
                      left: n.x - 12,
                      top: n.y + NODE_SPECS[n.type].height / 2 - 12,
                    }}
                    title="Target"
                  />
                )}
              </div>
            ))}

            {/* Removed variables UI */}
          </div>
        </div>
      </main>

      {/* Create Flow Modal */}
      {showCreateFlow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Create New Flow
              </h3>
              <button
                onClick={() => {
                  setShowCreateFlow(false);
                  setNewFlowForm({ name: "", description: "" });
                }}
                className="w-8 h-8 grid place-items-center rounded-md bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/70 block mb-2">
                  Flow Name
                </label>
                <input
                  type="text"
                  value={newFlowForm.name}
                  onChange={(e) =>
                    setNewFlowForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter flow name"
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="text-sm text-white/70 block mb-2">
                  Description
                </label>
                <textarea
                  value={newFlowForm.description}
                  onChange={(e) =>
                    setNewFlowForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter flow description"
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateFlow(false);
                    setNewFlowForm({ name: "", description: "" });
                  }}
                  className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white border border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={createFlow}
                  disabled={
                    !newFlowForm.name.trim() || !newFlowForm.description.trim()
                  }
                  className="flex-1 py-2 px-4 bg-white/20 hover:bg-white/30 disabled:bg-white/5 disabled:text-white/50 rounded-lg text-sm text-white"
                >
                  Create Flow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Node Details Modal */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Node Details</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-8 h-8 grid place-items-center rounded-md bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/70">Name</label>
                  <div className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm text-white/80">
                    {selectedNode.name}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/70">Description</label>
                  <div className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm text-white/80 min-h-[60px]">
                    {selectedNode.description}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/70">Type</label>
                  <p className="text-white font-medium">
                    {NODE_SPECS[selectedNode.type].label}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/70">Category</label>
                  <p className="text-white font-medium">
                    {NODE_SPECS[selectedNode.type].category}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/70">Position</label>
                  <p className="text-white font-medium">
                    X: {Math.round(selectedNode.x)}, Y:{" "}
                    {Math.round(selectedNode.y)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/70">Connections</label>
                  <p className="text-white font-medium">
                    Incoming: {countIncoming(selectedNode.id)}, Outgoing:{" "}
                    {countOutgoing(selectedNode.id)}
                  </p>
                </div>

                {/* API Configuration Section */}
                <div className="border border-white/10 rounded-lg">
                  <div className="px-3 py-2 border-b border-white/10 text-sm font-medium">
                    API Configuration
                  </div>
                  <div className="p-3 space-y-3">
                    {selectedNode.flowNodeId && (
                      <div className="text-xs text-blue-400 bg-blue-400/10 p-2 rounded">
                        <strong>Backend ID:</strong> {selectedNode.flowNodeId}
                      </div>
                    )}

                    {/* Node-specific parameter hints based on type */}
                    {selectedNode.type.includes("cron") && (
                      <div className="text-xs text-blue-400 bg-blue-400/10 p-2 rounded">
                        <strong>Cron Trigger:</strong> Use "time" parameter with
                        cron expression (e.g., "0 0 * * *" for daily)
                      </div>
                    )}
                    {selectedNode.type.includes("compound") && (
                      <div className="text-xs text-green-400 bg-green-400/10 p-2 rounded">
                        <strong>Auto Compound:</strong> Use "minThreshold"
                        parameter (default: 5) and "asset" in payload
                      </div>
                    )}
                    {selectedNode.type.includes("email") && (
                      <div className="text-xs text-yellow-400 bg-yellow-400/10 p-2 rounded">
                        <strong>Email Logger:</strong> Configure "transporter",
                        "from", and "to" parameters
                      </div>
                    )}

                    {/* Parameter Form */}
                    <NodeParameterForm
                      requiredParams={
                        selectedNode.requiredParamsPayloadKeysTypes || {}
                      }
                      currentValues={editingParams}
                      onChange={setEditingParams}
                      nodeType={selectedNode.type}
                    />

                    {/* Variables Form */}
                    <NodeVariablesForm
                      variables={editingVariables}
                      onChange={setEditingVariables}
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            // Use the form values directly (no JSON parsing needed)
                            const parsedParams = editingParams;
                            console.log("Parsed Params:", parsedParams);
                            const parsedVariables = editingVariables;

                            // Update local state with new outputs based on variables
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode.id
                                  ? updateNodeOutputs(
                                      {
                                        ...n,
                                        params: parsedParams,
                                        variables: parsedVariables,
                                      },
                                      parsedVariables
                                    )
                                  : n
                              )
                            );

                            // Update selectedNode state with new outputs
                            const updatedNode = updateNodeOutputs(
                              {
                                ...selectedNode,
                                params: parsedParams,
                                variables: parsedVariables,
                              },
                              parsedVariables
                            );

                            setSelectedNode(updatedNode);

                            // Sync with backend if node has flowNodeId
                            if (selectedNode.flowNodeId && currentFlow) {
                              await fetch(
                                `${API_BASE_URL}/flow/${currentFlow.id}/node/${selectedNode.flowNodeId}`,
                                {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    name: selectedNode.name,
                                    description: selectedNode.description,
                                    params: JSON.stringify(parsedParams),
                                    variables: JSON.stringify(parsedVariables),
                                  }),
                                }
                              );
                              alert("Node updated successfully!");
                            } else {
                              alert("Local node updated successfully!");
                            }
                          } catch (error) {
                            console.error("Failed to update node:", error);
                            alert("Failed to update node");
                          }
                        }}
                        className="flex-1 py-2 px-4 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm border border-green-500/30"
                      >
                        {selectedNode.flowNodeId
                          ? "Save Changes"
                          : "Save Local"}
                      </button>

                      {/* Test HTTP Trigger Button */}
                      {selectedNode.type.includes("trigger") &&
                        selectedNode.flowNodeId &&
                        currentFlow && (
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch(
                                  `${API_BASE_URL}/flow/${currentFlow.id}/trigger/${selectedNode.flowNodeId}`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      test: true,
                                      timestamp: new Date().toISOString(),
                                    }),
                                  }
                                );

                                if (response.ok) {
                                  const result = await response.json();
                                  alert(
                                    `Trigger executed successfully!\nResult: ${JSON.stringify(
                                      result,
                                      null,
                                      2
                                    )}`
                                  );
                                } else {
                                  alert("Failed to execute trigger");
                                }
                              } catch (error) {
                                console.error(
                                  "Failed to execute trigger:",
                                  error
                                );
                                alert("Failed to execute trigger");
                              }
                            }}
                            className="flex-1 py-2 px-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm border border-blue-500/30"
                          >
                            Test Trigger
                          </button>
                        )}
                    </div>
                  </div>
                </div>
                {/* n8n-like IO and Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Inputs */}
                  <div className="border border-white/10 rounded-lg">
                    <div className="px-3 py-2 border-b border-white/10 text-sm font-medium">
                      Inputs
                    </div>
                    <div className="p-3 space-y-2">
                      {nodes.find((n) => n.id === selectedNode.id)?.inputs
                        ?.length ? (
                        nodes
                          .find((n) => n.id === selectedNode.id)!
                          .inputs.map((inp) => (
                            <div
                              key={inp.id}
                              className="flex items-center justify-between bg-white/5 rounded px-2 py-1"
                            >
                              <div className="text-xs">
                                <span className="text-white/90 font-medium">
                                  {inp.name}
                                </span>
                                <span className="text-white/50 ml-2">
                                  {inp.type}
                                </span>
                              </div>
                              <button
                                className="w-6 h-6 grid place-items-center rounded bg-white/10 hover:bg-white/20"
                                onClick={() =>
                                  setNodes((prev) =>
                                    prev.map((n) =>
                                      n.id === selectedNode.id
                                        ? {
                                            ...n,
                                            inputs: n.inputs.filter(
                                              (i) => i.id !== inp.id
                                            ),
                                          }
                                        : n
                                    )
                                  )
                                }
                                title="Remove input"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                      ) : (
                        <p className="text-xs text-white/50">No inputs</p>
                      )}
                    </div>
                  </div>
                  {/* Outputs */}
                  <div className="border border-white/10 rounded-lg">
                    <div className="px-3 py-2 border-b border-white/10 text-sm font-medium">
                      Outputs
                    </div>
                    <div className="p-3 space-y-3">
                      {(() => {
                        const currentNode = nodes.find(
                          (n) => n.id === selectedNode.id
                        );
                        if (!currentNode?.outputs?.length) {
                          return (
                            <p className="text-xs text-white/50">No outputs</p>
                          );
                        }

                        // Separate payload outputs from variables
                        const payloadOutputs = currentNode.outputs.filter(
                          (out) => out.id !== "output-variables"
                        );
                        const variablesOutput = currentNode.outputs.find(
                          (out) => out.id === "output-variables"
                        );

                        return (
                          <>
                            {/* Output Structure Preview */}
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-xs font-medium text-white/90 mb-2">
                                Output Structure:
                              </div>
                              <div className="text-xs font-mono text-white/70 bg-black/20 rounded p-2">
                                {"{\n"}
                                {payloadOutputs.map((out, index) => (
                                  <span key={out.id}>
                                    {"  "}
                                    {out.name}: "{out.type}"
                                    {index < payloadOutputs.length - 1 ||
                                    (currentNode.variables &&
                                      Object.keys(currentNode.variables)
                                        .length > 0)
                                      ? ","
                                      : ""}
                                    {"\n"}
                                  </span>
                                ))}
                                {currentNode.variables &&
                                  Object.keys(currentNode.variables).length >
                                    0 && (
                                    <>
                                      {"  variables: {\n"}
                                      {Object.entries(
                                        currentNode.variables
                                      ).map(([varName], index, arr) => (
                                        <span key={varName}>
                                          {"    "}
                                          {varName}: "result"
                                          {index < arr.length - 1 ? "," : ""}
                                          {"\n"}
                                        </span>
                                      ))}
                                      {"  }\n"}
                                    </>
                                  )}
                                {"}"}
                              </div>
                            </div>

                            {/* Individual Output Items */}
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-white/90">
                                Available Outputs:
                              </div>
                              {currentNode.outputs.map((out) => (
                                <div
                                  key={out.id}
                                  className="flex items-center justify-between bg-white/5 rounded px-2 py-1"
                                >
                                  <div className="text-xs">
                                    <span className="text-white/90 font-medium">
                                      {out.name}
                                    </span>
                                    <span className="text-white/50 ml-2">
                                      {out.type}
                                    </span>
                                    {out.id === "output-variables" && (
                                      <span className="text-blue-400 ml-2 text-[10px]">
                                        (Custom Variables)
                                      </span>
                                    )}
                                  </div>
                                  {out.id !== "output-variables" && (
                                    <button
                                      className="w-6 h-6 grid place-items-center rounded bg-white/10 hover:bg-white/20"
                                      onClick={() =>
                                        setNodes((prev) =>
                                          prev.map((n) =>
                                            n.id === selectedNode.id
                                              ? {
                                                  ...n,
                                                  outputs: n.outputs.filter(
                                                    (o) => o.id !== out.id
                                                  ),
                                                }
                                              : n
                                          )
                                        )
                                      }
                                      title="Remove output"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feature;
