import Field from './Field.jsx';
import { BLOCK_TYPES, SCENE_FIELDS, fieldError, fieldsFor, getValue } from '../model.js';

export default function Inspector({ selected, scene, onChange, onSceneChange }) {
  if (selected.length === 0) {
    return (
      <aside className="panel inspector">
        <h2>Scene</h2>
        <div className="geo-grid">
          {SCENE_FIELDS.map(f => (
            <Field key={f.key} field={f} value={scene[f.key]} onChange={v => onSceneChange({ [f.key]: v })} />
          ))}
        </div>
        <p className="muted">Select an object to edit it. Drag on empty space to select several.</p>
      </aside>
    );
  }
  if (selected.length > 1) {
    return (
      <aside className="panel inspector">
        <h2>{selected.length} objects</h2>
        <p className="muted">Drag to move them together. Shift+click adds or removes an object.</p>
      </aside>
    );
  }
  const obj = selected[0];
  const fields = fieldsFor(obj);
  const render = f => (
    <Field
      key={`${obj.id}:${f.key}`}
      field={f}
      value={getValue(obj, f.key)}
      error={fieldError(obj, f.key)}
      onChange={v => onChange({ [f.key]: v })}
    />
  );
  return (
    <aside className="panel inspector">
      <h2>{BLOCK_TYPES.find(t => t.type === obj.type).label}</h2>
      <div className="geo-grid">{fields.filter(f => f.geo).map(render)}</div>
      {fields.filter(f => !f.geo).map(render)}
    </aside>
  );
}
