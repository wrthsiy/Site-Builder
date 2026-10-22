import { useEffect, useRef, useState } from 'react';

function NumberInput({ value, onChange }) {
  const [draft, setDraft] = useState(String(value));
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setDraft(String(value)); }, [value]);
  return (
    <input
      type="number"
      step="1"
      value={draft}
      onFocus={() => { focused.current = true; }}
      onBlur={() => { focused.current = false; setDraft(String(value)); }}
      onChange={e => {
        setDraft(e.target.value);
        const n = parseFloat(e.target.value);
        if (Number.isFinite(n)) onChange(n);
      }}
    />
  );
}

export default function Field({ field, value, onChange, error }) {
  const { label, kind } = field;
  const set = e => onChange(e.target.value);

  const pickFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  let control;
  switch (kind) {
    case 'area':
      control = <textarea rows={3} value={value} onChange={set} />;
      break;
    case 'select':
      control = (
        <select value={value} onChange={set}>
          {field.options.map(o => {
            const [v, text] = Array.isArray(o) ? o : [o, o];
            return <option key={v} value={v}>{text}</option>;
          })}
        </select>
      );
      break;
    case 'range':
      control = <input type="range" min={field.min} max={field.max} value={value} onChange={e => onChange(+e.target.value)} />;
      break;
    case 'number':
      control = <NumberInput value={value} onChange={onChange} />;
      break;
    case 'angle':
      control = (
        <div className="angle-row">
          <input type="range" min={-180} max={180} value={Math.max(-180, Math.min(180, value))} onChange={e => onChange(+e.target.value)} />
          <NumberInput value={value} onChange={onChange} />
        </div>
      );
      break;
    case 'color':
      control = <input type="color" value={value} onChange={set} />;
      break;
    case 'image':
      control = (
        <div className="image-row">
          <input
            type="text"
            placeholder="https://…"
            value={value.startsWith('data:') ? '(uploaded image)' : value}
            onFocus={e => e.target.select()}
            onChange={set}
          />
          <label className="btn small">
            Upload
            <input type="file" accept="image/*" hidden onChange={pickFile} />
          </label>
        </div>
      );
      break;
    default:
      control = <input type="text" value={value} onChange={set} />;
  }

  const Wrapper = kind === 'image' || kind === 'angle' ? 'div' : 'label';
  return (
    <Wrapper className={`field${field.wide ? ' wide' : ''}`}>
      <span className="field-label">{label}{kind === 'range' && <em>{value}</em>}</span>
      {control}
      {error && <small className="field-error">{error}</small>}
    </Wrapper>
  );
}
