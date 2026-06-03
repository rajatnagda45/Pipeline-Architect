import { useState, useRef, useCallback } from 'react';
import ReactFlow, {
  Controls, Background, MiniMap, BackgroundVariant, ConnectionMode,
} from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';

import { InputNode }  from './nodes/inputNode';
import { OutputNode } from './nodes/outputNode';
import { LLMNode }    from './nodes/llmNode';
import { TextNode }   from './nodes/textNode';
import { FilterNode } from './nodes/demo/filterNode';
import { MathNode }   from './nodes/demo/mathNode';
import { ApiNode }    from './nodes/demo/apiNode';
import { DelayNode }  from './nodes/demo/delayNode';
import { NoteNode }   from './nodes/demo/noteNode';

import { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from './toolbar';
import { colors } from './styles/theme';
import { useTheme } from './ThemeContext';
import { nodeColorMap } from './nodes/nodeConfigs';
import { ContextMenu }       from './ContextMenu';
import { CanvasContextMenu } from './CanvasContextMenu';
import { EdgeContextMenu }   from './EdgeContextMenu';
import { EmptyState }        from './EmptyState';

import 'reactflow/dist/style.css';

// Matches Stitch spec: 24px radial-gradient grid
const gridSize   = 24;
const proOptions = { hideAttribution: true };

const nodeTypes = {
  customInput:  InputNode,
  customOutput: OutputNode,
  llm:          LLMNode,
  text:         TextNode,
  filter:       FilterNode,
  math:         MathNode,
  api:          ApiNode,
  delay:        DelayNode,
  note:         NoteNode,
};

const selector = (state) => ({
  nodes:          state.nodes,
  edges:          state.edges,
  getNodeID:      state.getNodeID,
  addNode:        state.addNode,
  onNodesChange:  state.onNodesChange,
  onEdgesChange:  state.onEdgesChange,
  onConnect:      state.onConnect,
  deleteNode:     state.deleteNode,
  duplicateNode:  state.duplicateNode,
  setRFInstance:  state.setRFInstance,
  reconnectEdge:  state.reconnectEdge,
});

// Minimap node colors — derived from nodeColorMap (category-based) so they
// always match the rendered nodes on the canvas.
const MINIMAP_COLORS = nodeColorMap;

export const PipelineUI = ({ onOpenPalette }) => {
  useTheme(); // subscribe so canvas re-renders on theme toggle
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodeMenu,   setNodeMenu]   = useState(null);
  const [canvasMenu, setCanvasMenu] = useState(null);
  const [edgeMenu,   setEdgeMenu]   = useState(null);
  const reconnecting = useRef(false);

  const {
    nodes, edges, getNodeID, addNode,
    onNodesChange, onEdgesChange, onConnect,
    deleteNode, duplicateNode, setRFInstance, reconnectEdge,
  } = useStore(selector, shallow);

  const onInit = useCallback((instance) => {
    setReactFlowInstance(instance);
    setRFInstance(instance);
  }, [setRFInstance]);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const raw    = event.dataTransfer.getData('application/reactflow');
      if (!raw) return;
      let parsed;
      try { parsed = JSON.parse(raw); } catch { return; }
      const type = parsed?.nodeType;
      if (!type) return;
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      const nodeID = getNodeID(type);
      addNode({ id: nodeID, type, position, data: { id: nodeID, nodeType: type } });
    },
    [reactFlowInstance, getNodeID, addNode]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // ── Context menus ──────────────────────────────────────────────────────────

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    event.stopPropagation();
    setCanvasMenu(null); setEdgeMenu(null);
    setNodeMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
  }, []);

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    setNodeMenu(null); setEdgeMenu(null);
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    setCanvasMenu({
      x: event.clientX, y: event.clientY,
      canvasX: event.clientX - (bounds?.left ?? 0),
      canvasY: event.clientY - (bounds?.top  ?? 0),
    });
  }, []);

  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    setNodeMenu(null); setCanvasMenu(null);
    setEdgeMenu({ x: event.clientX, y: event.clientY, edge });
  }, []);

  const closeAll = useCallback(() => {
    setNodeMenu(null); setCanvasMenu(null); setEdgeMenu(null);
  }, []);

  // ── Edge reconnect — drag an edge endpoint to fix a wrong connection ───────

  const onReconnectStart = useCallback(() => {
    reconnecting.current = true;
  }, []);

  const onReconnect = useCallback((oldEdge, newConnection) => {
    reconnecting.current = false;
    reconnectEdge(oldEdge, newConnection);
  }, [reconnectEdge]);

  // If the endpoint is dropped on empty space, remove the dangling edge
  const onReconnectEnd = useCallback((_, edge) => {
    if (reconnecting.current) {
      useStore.getState().deleteEdge(edge.id);
    }
    reconnecting.current = false;
  }, []);

  return (
    <div
      ref={reactFlowWrapper}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'fixed',
        top:      `${TOPBAR_HEIGHT}px`,
        left:     `${SIDEBAR_WIDTH}px`,
        right:    0,
        bottom:   0,
        background: colors.canvas,
      }}
    >
      {nodes.length === 0 && (
        <EmptyState onOpenPalette={onOpenPalette} />
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={onInit}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={closeAll}
        nodeTypes={nodeTypes}
        // Edge reconnect: grab either endpoint of a selected edge to rewire it
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        reconnectRadius={20}
        proOptions={proOptions}
        snapGrid={[gridSize, gridSize]}
        snapToGrid
        // Loose mode: accepts connections on any handle regardless of type
        // so nodes with top/bottom handles can connect freely in any topology
        connectionMode={ConnectionMode.Loose}
        connectionLineType="smoothstep"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.95 }}
        fitView
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode="Shift"
      >
        {/* Dot grid — gap:24 matches snap grid; color is outlineStrong for clear visibility */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color={colors.outlineStrong}
        />

        <Controls position="bottom-left" showInteractive={false} />

        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={(n) => `${MINIMAP_COLORS[n.type] || colors.outline}b8`}
          nodeStrokeColor={(n) => MINIMAP_COLORS[n.type] || colors.outline}
          nodeStrokeWidth={2}
          nodeBorderRadius={2}
          maskColor={`${colors.canvas}88`}
          style={{ width: 200, height: 140 }}
        />
      </ReactFlow>

      {nodeMenu && (
        <ContextMenu
          x={nodeMenu.x} y={nodeMenu.y} nodeId={nodeMenu.nodeId}
          onDelete={deleteNode} onDuplicate={duplicateNode} onClose={closeAll}
        />
      )}

      {canvasMenu && (
        <CanvasContextMenu
          x={canvasMenu.x} y={canvasMenu.y}
          canvasX={canvasMenu.canvasX} canvasY={canvasMenu.canvasY}
          rfInstance={reactFlowInstance}
          onClose={closeAll}
        />
      )}

      {edgeMenu && (
        <EdgeContextMenu
          x={edgeMenu.x} y={edgeMenu.y} edge={edgeMenu.edge}
          onClose={closeAll}
        />
      )}
    </div>
  );
};
