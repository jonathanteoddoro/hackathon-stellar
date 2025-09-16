import { useCallback, useEffect, useRef, useState } from "react";
import { Mail, Shuffle, Plus, Minus, Webhook, LineChart, Database, MessageSquare, Filter, Wand2, Sigma, Bell, Send, Play, Eye, X, ChevronDown, Trash2, FolderPlus, Settings } from "lucide-react";
import DotPattern from "../components/dot-pattern";

// Three mocked nodes per category
// NodeType is string to allow dynamic node types fetched from an API (prefixed with `api_...`)
type NodeType = string;

type VarType = 'string' | 'number' | 'boolean' | 'object';

type CanvasNode = {
  id: string;
  type: string;
  x: number;
  y: number;
  inputs: { id: string; name: string; type: VarType; value?: string }[];
  outputs: { id: string; name: string; type: VarType }[];
  flowNodeId?: string; // ID do nó no backend
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
    width: 200,
    height: 160,
    className:
      "rounded-l-2xl rounded-r-xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Shuffle,
    label: "SWAP",
    category: "Trigger",
    canStartConnection: true,
    canReceiveConnection: false,
  },
  webhook_in: {
    width: 200,
    height: 160,
    className:
      "rounded-l-2xl rounded-r-xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Webhook,
    label: "WEBHOOK IN",
    category: "Trigger",
    canStartConnection: true,
    canReceiveConnection: false,
  },
  price_feed: {
    width: 200,
    height: 160,
    className:
      "rounded-l-2xl rounded-r-xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: LineChart,
    label: "PRICE FEED",
    category: "Trigger",
    canStartConnection: true,
    canReceiveConnection: false,
  },
  email: {
    width: 220,
    height: 120,
    className:
      "rounded-xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Mail,
    label: "EMAIL",
    category: "Logger",
    canStartConnection: false,
    canReceiveConnection: true,
  },
  logger_db: {
    width: 220,
    height: 120,
    className:
      "rounded-xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Database,
    label: "DB LOGGER",
    category: "Logger",
    canStartConnection: false,
    canReceiveConnection: true,
  },
  logger_chat: {
    width: 220,
    height: 120,
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
    width: 180,
    height: 180,
    className:
      "rounded-2xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Filter,
    label: "FILTER",
    category: "Operations",
    canStartConnection: true,
    canReceiveConnection: true,
  },
  transform: {
    width: 180,
    height: 180,
    className:
      "rounded-2xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Wand2,
    label: "TRANSFORM",
    category: "Operations",
    canStartConnection: true,
    canReceiveConnection: true,
  },
  aggregate: {
    width: 180,
    height: 180,
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
    width: 160,
    height: 160,
    className:
      "rounded-full bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Bell,
    label: "NOTIFY",
    category: "Action",
    canStartConnection: true,
    canReceiveConnection: true,
  },
  execute: {
    width: 160,
    height: 160,
    className:
      "rounded-full bg-[#0d0d0d] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
    icon: Play,
    label: "EXECUTE",
    category: "Action",
    canStartConnection: true,
    canReceiveConnection: true,
  },
  webhook_out: {
    width: 160,
    height: 160,
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
        square ? "h-28 p-3 grid place-items-center overflow-hidden" : "flex items-center gap-4 px-5 py-4"
      } rounded-xl border border-white/10 select-none ${
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
        <div className="flex flex-col items-center justify-center gap-2 w-full h-full p-2">
          <div className="grid place-items-center w-12 h-12 rounded-lg border border-white/10 bg-black/60 flex-shrink-0">
            <Icon className="w-6 h-6 text-white/90" />
          </div>
          <span className="text-[11px] leading-tight tracking-wide font-medium text-white/90 text-center truncate w-full">{label}</span>
        </div>
      ) : (
        <>
          <div className="grid place-items-center w-12 h-12 rounded-lg border border-white/10 bg-black/60 flex-shrink-0">
            <Icon className="w-6 h-6 text-white/90" />
          </div>
          <span className="tracking-wide font-medium truncate max-w-[10rem]">{label}</span>
        </>
      )}
    </div>
  );
}

function NodeBox({ node, onRemove, onViewDetails, onStartDrag }: { node: CanvasNode; onRemove: (id: string) => Promise<void> | void; onViewDetails: (node: CanvasNode) => void; onStartDrag: (id: string, e: React.MouseEvent) => void }) {
  const spec = NODE_SPECS[node.type];
  const Icon = spec.icon;

  return (
    <div className="absolute" style={{ left: node.x, top: node.y, width: spec.width, height: spec.height }} onMouseDown={(e) => onStartDrag(node.id, e)}>
      <div className={`${spec.className} ${CATEGORY_NODE_BG_CLASS[spec.category]} w-full h-full relative overflow-hidden`}>
        <button
          onClick={() => onRemove(node.id)}
          className="absolute top-2 left-2 w-6 h-6 grid place-items-center rounded-md bg-white/90 text-black"
          title="Remove"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewDetails(node)}
          className="absolute top-2 right-2 w-6 h-6 grid place-items-center rounded-md bg-white/90 text-black"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <div className="w-full h-full flex flex-col items-center justify-center text-white/85 tracking-wider p-3 box-border">
          <div className="flex flex-col items-center gap-2 max-w-full">
            <div className="grid place-items-center w-10 h-10 rounded-md bg-black/50">
              <Icon className="w-6 h-6" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium block max-w-[180px] leading-tight line-clamp-2 overflow-hidden text-ellipsis">{spec.label}</span>
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
  const [newFlowForm, setNewFlowForm] = useState({ name: '', description: '' });
  
  // Canvas state (per flow)
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  // track used node types (supports dynamic api_ keys)
  const [usedTypes, setUsedTypes] = useState<Record<string, boolean>>({});
  const [dragConnection, setDragConnection] = useState<
    | { fromId: string; start: { x: number; y: number }; current: { x: number; y: number } }
    | null
  >(null);
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [paramForm, setParamForm] = useState<{ name: string; type: VarType; attachTo: 'input' | 'output' }>({ name: '', type: 'string', attachTo: 'input' });
  const [openSections, setOpenSections] = useState<{ Trigger: boolean; Logger: boolean; Operations: boolean; Action: boolean }>({
    Trigger: false,
    Logger: false,
    Operations: false,
    Action: false,
  });
  type ApiNode = { name: string; id: string; type: string; description?: string };
  const [apiNodes, setApiNodes] = useState<ApiNode[]>([]);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [dragNode, setDragNode] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [zoom, setZoom] = useState<number>(0.85);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/x-node-type") as NodeType;
    if (!type) return;
    
    // Require flow selection
    if (!currentFlow) {
      alert('Please select or create a flow first');
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const spec = NODE_SPECS[type];
    const x = (e.clientX - rect.left) / zoom - spec.width / 2;
    const y = (e.clientY - rect.top) / zoom - spec.height / 2;

    // if this node type was already used, block additional drops
    if (usedTypes[type]) return;

    const newNode: CanvasNode = { id: `${Date.now()}-${nodes.length}`, type, x, y, inputs: [], outputs: [] };
    
    // If it's an API node, save to backend
    if (type.startsWith('api_')) {
      try {
        const apiNode = apiNodes.find(n => `api_${n.name.toLowerCase()}` === type);
        if (apiNode) {
          const response = await fetch(`http://localhost:3000/flow/${currentFlow.id}/new-node`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              predefinedNodeId: apiNode.id,
              name: apiNode.name,
              type: apiNode.type,
              description: apiNode.description,
              params: '{}',
              x: Math.round(x),
              y: Math.round(y),
              variables: '{}'
            })
          });
          
          if (response.ok) {
            const createdNode = await response.json();
            newNode.flowNodeId = createdNode.id;
          }
        }
      } catch (error) {
        console.error('Failed to save node to backend:', error);
      }
    }
    
    setNodes((prev) => [...prev, newNode]);
    setUsedTypes((prev) => ({ ...prev, [type]: true }));
  }, [zoom, usedTypes, nodes.length, currentFlow, apiNodes]);

  // Flow management functions
  const createFlow = useCallback(async () => {
    if (!newFlowForm.name.trim() || !newFlowForm.description.trim()) return;
    
    try {
      const response = await fetch('http://localhost:3000/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFlowForm.name.trim(),
          description: newFlowForm.description.trim()
        })
      });
      
      if (response.ok) {
        const flow = await response.json();
        setFlows(prev => [...prev, flow]);
        setCurrentFlow(flow);
        setShowCreateFlow(false);
        setNewFlowForm({ name: '', description: '' });
        // Clear canvas for new flow
        setNodes([]);
        setEdges([]);
        setUsedTypes({});
      }
    } catch (error) {
      console.error('Failed to create flow:', error);
    }
  }, [newFlowForm]);

  const switchFlow = useCallback((flow: Flow) => {
    setCurrentFlow(flow);
    // TODO: Load nodes for this flow
    setNodes([]);
    setEdges([]);
    setUsedTypes({});
  }, []);

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

  const countIncoming = useCallback((nodeId: string) => edges.filter((e) => e.toId === nodeId).length, [edges]);
  const countOutgoing = useCallback((nodeId: string) => edges.filter((e) => e.fromId === nodeId).length, [edges]);

  const canNodeStartNow = useCallback(
    (node: CanvasNode) => {
      const spec = NODE_SPECS[node.type];
      if (!spec.canStartConnection) return false;
      if (spec.category === "Trigger") return countOutgoing(node.id) === 0;
      if (spec.category === "Operations") return true; // can always start
      if (spec.category === "Action") return true; // same as operations
      return false;
    },
  [countOutgoing]
  );

  const canNodeReceiveNow = useCallback(
    (node: CanvasNode) => {
      const spec = NODE_SPECS[node.type];
      if (!spec.canReceiveConnection) return false;
      if (spec.category === "Operations" || spec.category === "Action") return true; // can always receive
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
                current: { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom },
            }
          : prev
      );
      }

      if (dragNode) {
        const { id, offsetX, offsetY } = dragNode;
        const newX = (e.clientX - rect.left) / zoom - offsetX;
        const newY = (e.clientY - rect.top) / zoom - offsetY;
        setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x: newX, y: newY } : n)));
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
      if (edges.some((e) => e.fromId === dragConnection.fromId && e.toId === toId)) {
        setDragConnection(null);
        return;
      }
      
      const fromNode = nodes.find((n) => n.id === dragConnection.fromId);
      
      // Create edge locally first
      const newEdge = { id: `${dragConnection.fromId}->${toId}-${Date.now()}`, fromId: dragConnection.fromId, toId };
      setEdges((prev) => [...prev, newEdge]);
      setDragConnection(null);
      
      // If both nodes have flowNodeId, sync with backend
      if (fromNode?.flowNodeId && toNode?.flowNodeId && currentFlow) {
        try {
          await fetch('http://localhost:3000/flow/link-nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromNodeId: fromNode.flowNodeId,
              toNodeId: toNode.flowNodeId,
              isForErrorFlow: false
            })
          });
        } catch (error) {
          console.error('Failed to link nodes in backend:', error);
          // Optionally revert the local change
          setEdges((prev) => prev.filter(e => e.id !== newEdge.id));
        }
      }
    },
    [dragConnection, canNodeReceiveNow, nodes, edges, currentFlow]
  );

  const handleViewDetails = useCallback((node: CanvasNode) => {
    setSelectedNode(node);
  }, []);

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

  const onCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // If we're dragging a connection and click on empty space, cancel it
    if (dragConnection) {
      const target = e.target as HTMLElement;
      // Only cancel if clicking on the canvas itself, not on nodes or buttons
      if (target === canvasRef.current || target.closest('.canvas-background')) {
        setDragConnection(null);
      }
    }
  }, [dragConnection]);

  // Fetch nodes from local API and register them into NODE_SPECS dynamically
  useEffect(() => {
    let mounted = true;
    fetch("http://localhost:3000/predefined-nodes")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setApiNodes(data);
        (data as ApiNode[]).forEach((n: ApiNode) => {
          const key = `api_${n.name.toLowerCase()}`;
          // don't overwrite existing built-ins
          if (NODE_SPECS[key]) return;
          // map category to our categories (normalize)
          const t = (n.type || '').toLowerCase();
          console.log(n.type);
          const category: NodeSpec['category'] = t === 'logger' ? 'Logger' : t === 'trigger' ? 'Trigger' : t === 'operations' ? 'Operations' : 'Action';
          NODE_SPECS[key] = {
            width: 200,
            height: category === 'Trigger' ? 160 : 120,
            className: NODE_SPECS['swap'].className,
            icon: Mail,
            label: n.name.toUpperCase(),
            category,
            canStartConnection: category === 'Trigger' || category === 'Operations' || category === 'Action',
            canReceiveConnection: category === 'Logger' ? true : category !== 'Trigger',
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
                      <div className="text-sm font-medium text-white truncate">{currentFlow.name}</div>
                      <div className="text-xs text-white/60 truncate">{currentFlow.description}</div>
                    </div>
                    <button className="ml-2 w-6 h-6 grid place-items-center rounded hover:bg-white/10">
                      <Settings className="w-4 h-4 text-white/70" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-6">
                <div className="text-xs text-white/50 text-center py-2">No flow selected</div>
                <button
                  onClick={() => setShowCreateFlow(true)}
                  className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white"
                >
                  Create First Flow
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-scroll sidebar-scroll" style={{ scrollbarGutter: "stable" }}>
            {/* Trigger */}
            <button
              className="w-full px-6 py-3 text-sm text-white/80 flex items-center justify-between hover:bg-white/5"
              onClick={() => setOpenSections((s) => ({ ...s, Trigger: !s.Trigger }))}
            >
              <span>Trigger</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openSections.Trigger ? "rotate-180" : "rotate-0"}`} />
            </button>
            {openSections.Trigger && (
              <div className="px-6 mb-4 mt-2 grid grid-cols-3 gap-3">
                {apiNodes.filter(n => n.type.toLowerCase() === 'trigger').length > 0 ? (
                  apiNodes.filter(n => n.type.toLowerCase() === 'trigger').map(n => (
                    <SidebarCard
                      key={`api_${n.id}`}
                      square
                      category="Trigger"
                      label={n.name}
                      icon={Shuffle}
                      nodeType={`api_${n.name.toLowerCase()}`}
                      disabled={!!usedTypes[`api_${n.name.toLowerCase()}`]}
                    />
                  ))
                ) : (
                  <p className="text-xs text-white/50 col-span-3">No triggers available</p>
                )}
              </div>
            )}

            {/* Logger */}
            <button
              className="w-full px-6 py-3 text-sm text-white/80 flex items-center justify-between hover:bg-white/5"
              onClick={() => setOpenSections((s) => ({ ...s, Logger: !s.Logger }))}
            >
              <span>Logger</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openSections.Logger ? "rotate-180" : "rotate-0"}`} />
            </button>
            {openSections.Logger && (
              <div className="px-6 mb-4 mt-2 grid grid-cols-3 gap-3">
                {apiNodes.filter(n => n.type.toLowerCase() === 'logger').length > 0 ? (
                  apiNodes.filter(n => n.type.toLowerCase() === 'logger').map(n => (
                    <SidebarCard
                      key={`api_${n.id}`}
                      square
                      category="Logger"
                      label={n.name}
                      icon={Mail}
                      nodeType={`api_${n.name.toLowerCase()}`}
                      disabled={!!usedTypes[`api_${n.name.toLowerCase()}`]}
                    />
                  ))
                ) : (
                  <p className="text-xs text-white/50 col-span-3">No loggers available</p>
                )}
              </div>
            )}

            {/* Operations */}
            <button
              className="w-full px-6 py-3 text-sm text-white/80 flex items-center justify-between hover:bg-white/5"
              onClick={() => setOpenSections((s) => ({ ...s, Operations: !s.Operations }))}
            >
              <span>Operations</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openSections.Operations ? "rotate-180" : "rotate-0"}`} />
            </button>
            {openSections.Operations && (
              <div className="px-6 mb-4 mt-2 grid grid-cols-3 gap-3">
                {apiNodes.filter(n => n.type.toLowerCase() === 'operations').length > 0 ? (
                  apiNodes.filter(n => n.type.toLowerCase() === 'operations').map(n => (
                    <SidebarCard
                      key={`api_${n.id}`}
                      square
                      category="Operations"
                      label={n.name}
                      icon={Filter}
                      nodeType={`api_${n.name.toLowerCase()}`}
                      disabled={!!usedTypes[`api_${n.name.toLowerCase()}`]}
                    />
                  ))
                ) : (
                  <p className="text-xs text-white/50 col-span-3">No operations available</p>
                )}
              </div>
            )}

            {/* Action */}
            <button
              className="w-full px-6 py-3 text-sm text-white/80 flex items-center justify-between hover:bg-white/5"
              onClick={() => setOpenSections((s) => ({ ...s, Action: !s.Action }))}
            >
              <span>Action</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openSections.Action ? "rotate-180" : "rotate-0"}`} />
            </button>
            {openSections.Action && (
              <div className="px-6 mb-6 mt-2 grid grid-cols-3 gap-3">
                {apiNodes.filter(n => n.type.toLowerCase() === 'action').length > 0 ? (
                  apiNodes.filter(n => n.type.toLowerCase() === 'action').map(n => (
                    <SidebarCard
                      key={`api_${n.id}`}
                      square
                      category="Action"
                      label={n.name}
                      icon={Bell}
                      nodeType={`api_${n.name.toLowerCase()}`}
                      disabled={!!usedTypes[`api_${n.name.toLowerCase()}`]}
                    />
                  ))
                ) : (
                  <p className="text-xs text-white/50 col-span-3">No actions available</p>
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
          <button className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 text-white" onClick={() => setZoom((z) => Math.max(0.5, Number((z * 0.9).toFixed(3))))}>-</button>
          <span className="text-sm tabular-nums bg-white/5 rounded px-2 py-1">{Math.round(zoom * 100)}%</span>
          <button className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 text-white" onClick={() => setZoom((z) => Math.min(2, Number((z * 1.1).toFixed(3))))}>+</button>
          <button className="h-8 px-2 rounded-md bg-white/10 hover:bg-white/20 text-white" onClick={() => setZoom(0.85)}>Reset</button>
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
          <div className="absolute inset-0 origin-top-left" style={{ transform: `scale(${zoom})` }}>
          {/* SVG Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" shapeRendering="geometricPrecision" style={{ overflow: "visible" }}>
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
                    style={{ cursor: 'pointer' }}
                    className="pointer-events-auto"
                    onClick={async (event) => {
                      event.stopPropagation();
                      if (window.confirm('Remove this connection?')) {
                        const edgeToRemove = e;
                        const fromNode = nodes.find(n => n.id === edgeToRemove.fromId);
                        const toNode = nodes.find(n => n.id === edgeToRemove.toId);
                        
                        // Remove from UI immediately
                        setEdges((prev) => prev.filter((edge) => edge.id !== edgeToRemove.id));
                        
                        // If both nodes have flowNodeId, sync with backend
                        if (fromNode?.flowNodeId && toNode?.flowNodeId && currentFlow) {
                          try {
                            await fetch('http://localhost:3000/flow/unlink-nodes', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                fromNodeId: fromNode.flowNodeId,
                                toNodeId: toNode.flowNodeId,
                                isForErrorFlow: false
                              })
                            });
                          } catch (error) {
                            console.error('Failed to unlink nodes in backend:', error);
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
                d={`M ${dragConnection.start.x} ${dragConnection.start.y} C ${dragConnection.start.x + 50} ${dragConnection.start.y}, ${dragConnection.current.x - 50} ${dragConnection.current.y}, ${dragConnection.current.x} ${dragConnection.current.y}`}
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
                  const nodeToRemove = nodes.find(n => n.id === id);
                  
                  // Remove from UI immediately
                  setNodes((prev) => prev.filter((x) => x.id !== id));
                  setEdges((prev) => prev.filter((e) => e.fromId !== id && e.toId !== id));
                  setUsedTypes((prev) => ({ ...prev, [nodeToRemove?.type || '']: false }));
                  
                  // If node has flowNodeId and we have a current flow, sync with backend
                  if (nodeToRemove?.flowNodeId && currentFlow) {
                    try {
                      await fetch(`http://localhost:3000/flow/${currentFlow.id}/node/${nodeToRemove.flowNodeId}`, {
                        method: 'DELETE'
                      });
                    } catch (error) {
                      console.error('Failed to delete node from backend:', error);
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
                  style={{ left: n.x + NODE_SPECS[n.type].width - 12, top: n.y + NODE_SPECS[n.type].height / 2 - 12 }}
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
                  style={{ left: n.x - 12, top: n.y + NODE_SPECS[n.type].height / 2 - 12 }}
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
              <h3 className="text-lg font-semibold text-white">Create New Flow</h3>
              <button
                onClick={() => {
                  setShowCreateFlow(false);
                  setNewFlowForm({ name: '', description: '' });
                }}
                className="w-8 h-8 grid place-items-center rounded-md bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/70 block mb-2">Flow Name</label>
                <input
                  type="text"
                  value={newFlowForm.name}
                  onChange={(e) => setNewFlowForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter flow name"
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="text-sm text-white/70 block mb-2">Description</label>
                <textarea
                  value={newFlowForm.description}
                  onChange={(e) => setNewFlowForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter flow description"
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateFlow(false);
                    setNewFlowForm({ name: '', description: '' });
                  }}
                  className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white border border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={createFlow}
                  disabled={!newFlowForm.name.trim() || !newFlowForm.description.trim()}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Node Details</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-8 h-8 grid place-items-center rounded-md bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/70">Type</label>
                <p className="text-white font-medium">{NODE_SPECS[selectedNode.type].label}</p>
              </div>
              <div>
                <label className="text-sm text-white/70">Category</label>
                <p className="text-white font-medium">{NODE_SPECS[selectedNode.type].category}</p>
              </div>
              <div>
                <label className="text-sm text-white/70">Position</label>
                <p className="text-white font-medium">X: {Math.round(selectedNode.x)}, Y: {Math.round(selectedNode.y)}</p>
              </div>
              <div>
                <label className="text-sm text-white/70">Connections</label>
                <p className="text-white font-medium">
                  Incoming: {countIncoming(selectedNode.id)}, Outgoing: {countOutgoing(selectedNode.id)}
                </p>
              </div>
              {/* n8n-like IO and Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Inputs */}
                <div className="border border-white/10 rounded-lg">
                  <div className="px-3 py-2 border-b border-white/10 text-sm font-medium">Inputs</div>
                  <div className="p-3 space-y-2">
                    {nodes.find(n => n.id === selectedNode.id)?.inputs?.length ? (
                      nodes.find(n => n.id === selectedNode.id)!.inputs.map((inp) => (
                        <div key={inp.id} className="flex items-center justify-between bg-white/5 rounded px-2 py-1">
                          <div className="text-xs">
                            <span className="text-white/90 font-medium">{inp.name}</span>
                            <span className="text-white/50 ml-2">{inp.type}</span>
                          </div>
                          <button
                            className="w-6 h-6 grid place-items-center rounded bg-white/10 hover:bg-white/20"
                            onClick={() => setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, inputs: n.inputs.filter(i => i.id !== inp.id) } : n))}
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
                  <div className="px-3 py-2 border-b border-white/10 text-sm font-medium">Outputs</div>
                  <div className="p-3 space-y-2">
                    {nodes.find(n => n.id === selectedNode.id)?.outputs?.length ? (
                      nodes.find(n => n.id === selectedNode.id)!.outputs.map((out) => (
                        <div key={out.id} className="flex items-center justify-between bg-white/5 rounded px-2 py-1">
                          <div className="text-xs">
                            <span className="text-white/90 font-medium">{out.name}</span>
                            <span className="text-white/50 ml-2">{out.type}</span>
                          </div>
                          <button
                            className="w-6 h-6 grid place-items-center rounded bg-white/10 hover:bg-white/20"
                            onClick={() => setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, outputs: n.outputs.filter(o => o.id !== out.id) } : n))}
                            title="Remove output"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-white/50">No outputs</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Create parameter and attach */}
              <div className="border border-white/10 rounded-lg">
                <div className="px-3 py-2 border-b border-white/10 text-sm font-medium">Add parameter</div>
                <div className="p-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    value={paramForm.name}
                    onChange={(e) => setParamForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Name"
                    className="md:col-span-2 px-3 py-2 bg-white/5 border border-white/15 rounded text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <select
                    value={paramForm.type}
                    onChange={(e) => setParamForm((p) => ({ ...p, type: e.target.value as VarType }))}
                    className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm"
                  >
                    <option value="string" className="bg-[#0d0d0d] text-white">String</option>
                    <option value="number" className="bg-[#0d0d0d] text-white">Number</option>
                    <option value="boolean" className="bg-[#0d0d0d] text-white">Boolean</option>
                    <option value="object" className="bg-[#0d0d0d] text-white">Object</option>
                  </select>
                  <select
                    value={paramForm.attachTo}
                    onChange={(e) => setParamForm((p) => ({ ...p, attachTo: e.target.value as 'input' | 'output' }))}
                    className="px-3 py-2 bg-white/5 border border-white/15 rounded text-sm"
                  >
                    <option value="input" className="bg-[#0d0d0d] text-white">Attach to: Input</option>
                    <option value="output" className="bg-[#0d0d0d] text-white">Attach to: Output</option>
                  </select>
                  <button
                    className="md:col-span-4 h-9 rounded bg-white/10 hover:bg-white/20 text-sm"
                    onClick={() => {
                      if (!paramForm.name.trim()) return;
                      const id = `var-${Date.now()}`;
                      setNodes((prev) => prev.map((n) => {
                        if (n.id !== selectedNode.id) return n;
                        if (paramForm.attachTo === 'input') {
                          return { ...n, inputs: [...n.inputs, { id, name: paramForm.name.trim(), type: paramForm.type }] };
                        }
                        return { ...n, outputs: [...n.outputs, { id, name: paramForm.name.trim(), type: paramForm.type }] };
                      }));
                      setParamForm({ name: '', type: 'string', attachTo: 'input' });
                    }}
                  >
                    Add parameter
                  </button>
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


