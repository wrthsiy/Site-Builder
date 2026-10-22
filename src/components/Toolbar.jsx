const Tool = ({ on, children, ...rest }) => (
  <button type="button" className={`tool${on ? ' on' : ''}`} {...rest}>{children}</button>
);

export default function Toolbar(p) {
  return (
    <div className="toolbar" onMouseDown={e => e.preventDefault()}>
      <Tool on={p.snapGrid} onClick={p.onToggleGrid} title="Snap to 8px grid">Grid snap</Tool>
      <Tool on={p.snapEdges} onClick={p.onToggleEdges} title="Snap to scene edges">Edge snap</Tool>
      <span className="sep" />
      <Tool onClick={p.onZoomOut} title="Zoom out (Ctrl/Cmd + wheel)">−</Tool>
      <Tool className="zoom" onClick={p.onZoomReset} title="Reset zoom to 100%">{Math.round(p.zoom * 100)}%</Tool>
      <Tool onClick={p.onZoomIn} title="Zoom in (Ctrl/Cmd + wheel)">+</Tool>
      <span className="sep" />
      <Tool disabled={!p.hasSelection} onClick={p.onForward} title="Bring forward">Forward</Tool>
      <Tool disabled={!p.hasSelection} onClick={p.onBackward} title="Send backward">Backward</Tool>
      <Tool disabled={!p.hasSelection} onClick={p.onDuplicate} title="Duplicate (Ctrl/Cmd + D)">Duplicate</Tool>
      <Tool disabled={!p.hasSelection} onClick={p.onDelete} title="Delete (Del)">Delete</Tool>
      <span className="hint-keys">Space + drag to pan</span>
    </div>
  );
}
