import { useEffect, useRef, useState } from 'react';
import Palette from './components/Palette.jsx';
import Toolbar from './components/Toolbar.jsx';
import Canvas from './components/Canvas.jsx';
import Inspector from './components/Inspector.jsx';
import { GRID, SCENE_DEFAULT, cloneBlock, createBlock, patchObject } from './model.js';
import { downloadHtml, exportDocument } from './render.js';

const snap = v => Math.round(v / GRID) * GRID;
const topZ = os => os.reduce((m, o) => Math.max(m, o.zIndex), 0);
const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

export default function App() {
  const [objects, setObjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [scene, setScene] = useState(SCENE_DEFAULT);
  const [zoom, setZoom] = useState(1);
  const [snapGrid, setSnapGrid] = useState(true);
  const [snapEdges, setSnapEdges] = useState(false);
  const canvasRef = useRef(null);
  const clipboard = useRef({ items: [], pastes: 0 });

  const selected = objects.filter(o => selectedIds.includes(o.id));
  const has = selected.length > 0;

  const insertBlock = (type, x, y) => {
    const block = createBlock(type, x, y, topZ(objects) + 1);
    if (snapGrid) { block.x = snap(block.x); block.y = snap(block.y); }
    setObjects(os => [...os, block]);
    setSelectedIds([block.id]);
  };

  const addClones = (items, offset) => {
    let z = topZ(objects);
    const clones = [...items].sort((a, b) => a.zIndex - b.zIndex).map(o => cloneBlock(o, offset, offset, ++z));
    setObjects(os => [...os, ...clones]);
    setSelectedIds(clones.map(c => c.id));
  };

  const copy = () => { if (has) clipboard.current = { items: selected, pastes: 0 }; };
  const paste = () => {
    const c = clipboard.current;
    if (!c.items.length) return;
    c.pastes += 1;
    addClones(c.items, 16 * c.pastes);
  };
  const duplicate = () => { if (has) addClones(selected, 16); };

  const removeSelected = () => {
    if (!has) return;
    setObjects(os => os.filter(o => !selectedIds.includes(o.id)));
    setSelectedIds([]);
  };

  const nudge = (dx, dy) =>
    setObjects(os => os.map(o => (selectedIds.includes(o.id) ? { ...o, x: o.x + dx, y: o.y + dy } : o)));

  const moveLayer = dir => setObjects(os => {
    const sorted = [...os].sort((a, b) => a.zIndex - b.zIndex);
    const isSel = o => selectedIds.includes(o.id);
    const swap = (i, j) => { [sorted[i], sorted[j]] = [sorted[j], sorted[i]]; };
    if (dir > 0) {
      for (let i = sorted.length - 2; i >= 0; i--) if (isSel(sorted[i]) && !isSel(sorted[i + 1])) swap(i, i + 1);
    } else {
      for (let i = 1; i < sorted.length; i++) if (isSel(sorted[i]) && !isSel(sorted[i - 1])) swap(i, i - 1);
    }
    const z = new Map(sorted.map((o, i) => [o.id, i + 1]));
    return os.map(o => ({ ...o, zIndex: z.get(o.id) }));
  });

  const updateSelected = patch =>
    setObjects(os => os.map(o => (o.id === selectedIds[0] ? patchObject(o, patch) : o)));

  const updateScene = patch => setScene(s => {
    const [k, v] = Object.entries(patch)[0];
    return { ...s, [k]: Math.min(5000, Math.max(200, v)) };
  });

  const clearAll = () => {
    if (objects.length && window.confirm('Remove all objects?')) {
      setObjects([]);
      setSelectedIds([]);
    }
  };

  const keyRef = useRef();
  keyRef.current = e => {
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    if (mod && key === 'c') return copy();
    if (mod && key === 'v') return paste();
    if (mod && key === 'd') { e.preventDefault(); return duplicate(); }
    if (!has) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); return removeSelected(); }
    const dir = ARROWS[e.key];
    if (dir) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      nudge(dir[0] * step, dir[1] * step);
    }
  };
  useEffect(() => {
    const onKey = e => keyRef.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <h1>Site Builder</h1>
        <div className="actions">
          <button className="btn" onClick={clearAll} disabled={!objects.length}>Clear</button>
          <button
            className="btn primary"
            onClick={() => downloadHtml(exportDocument(objects, scene))}
            disabled={!objects.length}
          >
            Export HTML
          </button>
        </div>
      </header>
      <main className="workspace">
        <Palette />
        <div className="center">
          <Toolbar
            snapGrid={snapGrid}
            snapEdges={snapEdges}
            zoom={zoom}
            hasSelection={has}
            onToggleGrid={() => setSnapGrid(v => !v)}
            onToggleEdges={() => setSnapEdges(v => !v)}
            onZoomOut={() => canvasRef.current.zoomBy(1 / 1.25)}
            onZoomIn={() => canvasRef.current.zoomBy(1.25)}
            onZoomReset={() => canvasRef.current.zoomTo(1)}
            onForward={() => moveLayer(1)}
            onBackward={() => moveLayer(-1)}
            onDuplicate={duplicate}
            onDelete={removeSelected}
          />
          <Canvas
            ref={canvasRef}
            objects={objects}
            selectedIds={selectedIds}
            scene={scene}
            zoom={zoom}
            snapGrid={snapGrid}
            snapEdges={snapEdges}
            onSelect={setSelectedIds}
            onObjects={setObjects}
            onInsert={insertBlock}
            onZoom={setZoom}
          />
        </div>
        <Inspector selected={selected} scene={scene} onChange={updateSelected} onSceneChange={updateScene} />
      </main>
    </div>
  );
}
