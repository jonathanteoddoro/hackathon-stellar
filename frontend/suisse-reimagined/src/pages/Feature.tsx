import { useCallback, useRef, useState } from "react";
import { Mail, Shuffle, Plus, Minus, Webhook, LineChart, Database, MessageSquare, Filter, Wand2, Sigma, Bell, Send, Play, Eye, X, ChevronDown, Trash2 } from "lucide-react";
import DotPattern from "../components/dot-pattern";

// Three mocked nodes per category
type NodeType =
  | "swap" | "webhook_in" | "price_feed" // Triggers
  | "email" | "logger_db" | "logger_chat" // Loggers
  | "filter" | "transform" | "aggregate" // Operations
  | "notify" | "execute" | "webhook_out"; // Actions

type VarType = 'string' | 'number' | 'boolean' | 'object';

type CanvasNode = {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  inputs: { id: string; name: string; type: VarType; value?: string }[];
  outputs: { id: string; name: string; type: VarType }[];
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
  canReceiveConnection: boolean; // base capability
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

const NODE_SPECS: Record<NodeType, NodeSpec> = {
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
  icon: typeof Mail;
  nodeType: NodeType;
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
        <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
          <div className="grid place-items-center size-10 rounded-lg border border-white/10 bg-black/60">
            <Icon className="size-5 text-white/90" />
          </div>
          <span className="text-[10px] leading-tight tracking-wide font-medium text-white/90 text-center">{label}</span>
        </div>
      ) : (
        <>
          <div className="grid place-items-center size-10 rounded-lg border border-white/10 bg-black/60">
            <Icon className="size-5 text-white/90" />
          </div>
          <span className="tracking-wide font-medium">{label}</span>
        </>
      )}
    </div>
  );
}

function NodeBox({ node, onRemove, onViewDetails, onStartDrag }: { node: CanvasNode; onRemove: (id: string) => void; onViewDetails: (node: CanvasNode) => void; onStartDrag: (id: string, e: React.MouseEvent) => void }) {
  const spec = NODE_SPECS[node.type];
  const Icon = spec.icon;

  return (
    <div className="absolute" style={{ left: node.x, top: node.y, width: spec.width, height: spec.height }} onMouseDown={(e) => onStartDrag(node.id, e)}>
      <div className={`${spec.className} ${CATEGORY_NODE_BG_CLASS[spec.category]} w-full h-full relative`}>
        <button
          onClick={() => onRemove(node.id)}
          className="absolute top-1 left-1 size-6 grid place-items-center rounded-md bg-white/90 text-black"
          title="Remove"
        >
          <Minus className="size-4" />
        </button>
        <button
          onClick={() => onViewDetails(node)}
          className="absolute top-1 right-1 size-6 grid place-items-center rounded-md bg-white/90 text-black"
          title="View Details"
        >
          <Eye className="size-4" />
        </button>
        <div className="w-full h-full grid place-items-center text-white/85 tracking-wider">
          <div className="flex flex-col items-center gap-2">
            <Icon className="size-6" />
            <span>{spec.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const Feature = () => {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [usedTypes, setUsedTypes] = useState<Record<NodeType, boolean>>({
    swap: false,
    webhook_in: false,
    price_feed: false,
    email: false,
    logger_db: false,
    logger_chat: false,
    filter: false,
    transform: false,
    aggregate: false,
    notify: false,
    execute: false,
    webhook_out: false,
  });
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
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [dragNode, setDragNode] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [zoom, setZoom] = useState<number>(0.85);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/x-node-type") as NodeType;
    if (!type) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const spec = NODE_SPECS[type];
    const x = (e.clientX - rect.left) / zoom - spec.width / 2;
    const y = (e.clientY - rect.top) / zoom - spec.height / 2;

    // if this node type was already used, block additional drops
    if (usedTypes[type]) return;

    const newNode: CanvasNode = { id: `${Date.now()}-${nodes.length}`, type, x, y, inputs: [], outputs: [] };
    setNodes((prev) => [...prev, newNode]);
    setUsedTypes((prev) => ({ ...prev, [type]: true }));
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
    [countIncoming, countOutgoing]
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
    [dragConnection, dragNode, zoom, nodes]
  );

  const onCompleteConnect = useCallback(
    (toId: string) => (e: React.MouseEvent) => {
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
      setEdges((prev) => {
        if (dragConnection.fromId === toId) return prev;
        if (prev.some((e) => e.fromId === dragConnection.fromId && e.toId === toId)) return prev;
        return [...prev, { id: `${dragConnection.fromId}->${toId}-${Date.now()}`, fromId: dragConnection.fromId, toId }];
      });
      setDragConnection(null);
    },
    [dragConnection, canNodeReceiveNow, nodes]
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
          <div className="flex-1 overflow-y-scroll sidebar-scroll" style={{ scrollbarGutter: "stable" }}>
            {/* Trigger */}
            <button
              className="w-full px-6 py-3 text-sm text-white/80 flex items-center justify-between hover:bg-white/5"
              onClick={() => setOpenSections((s) => ({ ...s, Trigger: !s.Trigger }))}
            >
              <span>Trigger</span>
              <ChevronDown className={`size-4 transition-transform ${openSections.Trigger ? "rotate-180" : "rotate-0"}`} />
            </button>
            {openSections.Trigger && (
              <div className="px-6 mb-4 mt-2 grid grid-cols-3 gap-3">
                <SidebarCard square category="Trigger" label="SWAP" icon={Shuffle} nodeType="swap" disabled={usedTypes.swap} />
                <SidebarCard square category="Trigger" label="WEBHOOK IN" icon={Webhook} nodeType="webhook_in" disabled={usedTypes.webhook_in} />
                <SidebarCard square category="Trigger" label="PRICE FEED" icon={LineChart} nodeType="price_feed" disabled={usedTypes.price_feed} />
              </div>
            )}

            {/* Logger */}
            <button
              className="w-full px-6 py-3 text-sm text-white/80 flex items-center justify-between hover:bg-white/5"
              onClick={() => setOpenSections((s) => ({ ...s, Logger: !s.Logger }))}
            >
              <span>Logger</span>
              <ChevronDown className={`size-4 transition-transform ${openSections.Logger ? "rotate-180" : "rotate-0"}`} />
            </button>
            {openSections.Logger && (
              <div className="px-6 mb-4 mt-2 grid grid-cols-3 gap-3">
                <SidebarCard square category="Logger" label="EMAIL" icon={Mail} nodeType="email" disabled={usedTypes.email} />
                <SidebarCard square category="Logger" label="DB LOGGER" icon={Database} nodeType="logger_db" disabled={usedTypes.logger_db} />
                <SidebarCard square category="Logger" label="CHAT LOGGER" icon={MessageSquare} nodeType="logger_chat" disabled={usedTypes.logger_chat} />
              </div>
            )}

            {/* Operations */}
            <button
              className="w-full px-6 py-3 text-sm text-white/80 flex items-center justify-between hover:bg-white/5"
              onClick={() => setOpenSections((s) => ({ ...s, Operations: !s.Operations }))}
            >
              <span>Operations</span>
              <ChevronDown className={`size-4 transition-transform ${openSections.Operations ? "rotate-180" : "rotate-0"}`} />
            </button>
            {openSections.Operations && (
              <div className="px-6 mb-4 mt-2 grid grid-cols-3 gap-3">
                <SidebarCard square category="Operations" label="FILTER" icon={Filter} nodeType="filter" disabled={usedTypes.filter} />
                <SidebarCard square category="Operations" label="TRANSFORM" icon={Wand2} nodeType="transform" disabled={usedTypes.transform} />
                <SidebarCard square category="Operations" label="AGGREGATE" icon={Sigma} nodeType="aggregate" disabled={usedTypes.aggregate} />
              </div>
            )}

            {/* Action */}
            <button
              className="w-full px-6 py-3 text-sm text-white/80 flex items-center justify-between hover:bg-white/5"
              onClick={() => setOpenSections((s) => ({ ...s, Action: !s.Action }))}
            >
              <span>Action</span>
              <ChevronDown className={`size-4 transition-transform ${openSections.Action ? "rotate-180" : "rotate-0"}`} />
            </button>
            {openSections.Action && (
              <div className="px-6 mb-6 mt-2 grid grid-cols-3 gap-3">
                <SidebarCard square category="Action" label="NOTIFY" icon={Bell} nodeType="notify" disabled={usedTypes.notify} />
                <SidebarCard square category="Action" label="EXECUTE" icon={Play} nodeType="execute" disabled={usedTypes.execute} />
                <SidebarCard square category="Action" label="WEBHOOK OUT" icon={Send} nodeType="webhook_out" disabled={usedTypes.webhook_out} />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Canvas */}
      <main className="flex-1 relative">
        {/* Zoom Controls */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <button className="size-8 rounded-md bg-white/10 hover:bg-white/20 text-white" onClick={() => setZoom((z) => Math.max(0.5, Number((z * 0.9).toFixed(3))))}>-</button>
          <span className="text-sm tabular-nums bg-white/5 rounded px-2 py-1">{Math.round(zoom * 100)}%</span>
          <button className="size-8 rounded-md bg-white/10 hover:bg-white/20 text-white" onClick={() => setZoom((z) => Math.min(2, Number((z * 1.1).toFixed(3))))}>+</button>
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
                <path
                  key={e.id}
                  d={`M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`}
                  stroke="white"
                  strokeOpacity="0.85"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
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
                onRemove={(id) => {
                  setNodes((prev) => prev.filter((x) => x.id !== id));
                  setEdges((prev) => prev.filter((e) => e.fromId !== id && e.toId !== id));
                  setUsedTypes((prev) => ({ ...prev, [n.type]: false }));
                }}
                onViewDetails={handleViewDetails}
                onStartDrag={onStartDragNode}
              />
              {/* Source handle (plus) on right side if node can start now */}
              {canNodeStartNow(n) && (
                <button
                  onMouseDown={onStartConnect(n.id)}
                  className="absolute grid place-items-center size-6 rounded-md bg-white text-black shadow"
                  style={{ left: n.x + NODE_SPECS[n.type].width - 12, top: n.y + NODE_SPECS[n.type].height / 2 - 12 }}
                  title="Connect"
                >
                  <Plus className="size-4" />
                </button>
              )}
              {/* Target handle (hollow circle) when node can receive */}
              {canNodeReceiveNow(n) && (
                <button
                  onMouseUp={onCompleteConnect(n.id)}
                  className="absolute grid place-items-center size-6 rounded-full border-2 border-white/80 bg-transparent"
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


      {/* Node Details Modal */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Node Details</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="size-8 grid place-items-center rounded-md bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="size-4" />
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
                            className="size-6 grid place-items-center rounded bg-white/10 hover:bg-white/20"
                            onClick={() => setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, inputs: n.inputs.filter(i => i.id !== inp.id) } : n))}
                            title="Remove input"
                          >
                            <Trash2 className="size-3" />
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
                            className="size-6 grid place-items-center rounded bg-white/10 hover:bg-white/20"
                            onClick={() => setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, outputs: n.outputs.filter(o => o.id !== out.id) } : n))}
                            title="Remove output"
                          >
                            <Trash2 className="size-3" />
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


