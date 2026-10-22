import { BLOCK_TYPES } from '../model.js';

export const NEW_BLOCK = 'application/x-new-block';

export default function Palette() {
  return (
    <aside className="panel palette">
      <h2>Blocks</h2>
      {BLOCK_TYPES.map(({ type, label, icon }) => (
        <div
          key={type}
          className="palette-item"
          draggable
          onDragStart={e => {
            e.dataTransfer.setData(NEW_BLOCK, type);
            e.dataTransfer.effectAllowed = 'copy';
          }}
        >
          <i>{icon}</i>{label}
        </div>
      ))}
    </aside>
  );
}
