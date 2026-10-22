import { forwardRef, memo, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { objectHtml } from '../render.js';
import { GRID, MAX_ZOOM, MIN_ZOOM } from '../model.js';
import { NEW_BLOCK } from './Palette.jsx';

const PAD = 48;
const EDGE = 8;
const MIN = 4;
const HANDLES = [
  ['nw', -1, -1], ['n', 0, -1], ['ne', 1, -1], ['e', 1, 0],
  ['se', 1, 1], ['s', 0, 1], ['sw', -1, 1], ['w', -1, 0],
];
const CURSORS = {
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
  nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize',
};

const rnd = Math.round;
const typing = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);

const rotate = (x, y, deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [x * c - y * s, x * s + y * c];
};

function boundsOf(o) {
  const cx = o.x + o.width / 2, cy = o.y + o.height / 2;
  const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
    const [rx, ry] = rotate((a * o.width) / 2, (b * o.height) / 2, o.rotation);
    return [cx + rx, cy + ry];
  });
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return { l: Math.min(...xs), t: Math.min(...ys), r: Math.max(...xs), b: Math.max(...ys) };
}

const unionOf = list => list.map(boundsOf).reduce((a, b) => ({
  l: Math.min(a.l, b.l), t: Math.min(a.t, b.t), r: Math.max(a.r, b.r), b: Math.max(a.b, b.b),
}));

function track(onMove, onUp) {
  const up = e => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    if (onUp) onUp(e);
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

const ObjectView = memo(function ObjectView({ o }) {
  const host = useRef(null);
  const inner = useRef(null);
  useLayoutEffect(() => {
    const t = document.createElement('template');
    t.innerHTML = objectHtml(o);
    const next = t.content.firstElementChild;
    const cur = host.current.firstElementChild;
    if (cur && inner.current === next.innerHTML) cur.setAttribute('style', next.getAttribute('style'));
    else host.current.replaceChildren(next);
    inner.current = next.innerHTML;
  }, [o]);
  return <div ref={host} style={{ display: 'contents' }} />;
});

const Canvas = forwardRef(function Canvas(props, ref) {
  const { objects, selectedIds, scene, zoom, snapGrid, onInsert } = props;
  const viewRef = useRef(null);
  const wrapRef = useRef(null);
  const anchor = useRef(null);
  const [marquee, setMarquee] = useState(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const [panning, setPanning] = useState(false);
  const [over, setOver] = useState(false);
  const [rotating, setRotating] = useState(null);

  const live = useRef(props);
  live.current = { ...props, spaceDown };

  const toScene = e => {
    const r = wrapRef.current.getBoundingClientRect();
    const z = live.current.zoom;
    return [(e.clientX - r.left) / z, (e.clientY - r.top) / z];
  };

  const snapAxis = (v, size, max) => {
    const L = live.current;
    if (L.snapEdges) {
      if (Math.abs(v) < EDGE) return 0;
      if (Math.abs(v + size - max) < EDGE) return max - size;
    }
    return L.snapGrid ? rnd(v / GRID) * GRID : v;
  };

  const zoomAt = (next, mx, my) => {
    const v = viewRef.current, L = live.current;
    next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    if (Math.abs(next - L.zoom) < 1e-4) return;
    const vr = v.getBoundingClientRect(), wr = wrapRef.current.getBoundingClientRect();
    anchor.current = { sx: (vr.left + mx - wr.left) / L.zoom, sy: (vr.top + my - wr.top) / L.zoom, mx, my };
    L.zoom = next;
    L.onZoom(next);
  };

  useImperativeHandle(ref, () => ({
    zoomBy: f => { const v = viewRef.current; zoomAt(live.current.zoom * f, v.clientWidth / 2, v.clientHeight / 2); },
    zoomTo: z => { const v = viewRef.current; zoomAt(z, v.clientWidth / 2, v.clientHeight / 2); },
  }), []);

  useLayoutEffect(() => {
    const a = anchor.current;
    if (!a) return;
    anchor.current = null;
    const v = viewRef.current, vr = v.getBoundingClientRect(), wr = wrapRef.current.getBoundingClientRect();
    v.scrollLeft += wr.left - vr.left + a.sx * zoom - a.mx;
    v.scrollTop += wr.top - vr.top + a.sy * zoom - a.my;
  }, [zoom]);

  useEffect(() => {
    const v = viewRef.current;
    const onWheel = e => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const r = v.getBoundingClientRect();
      zoomAt(live.current.zoom * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    const keyOk = () => {
      const a = document.activeElement;
      return !typing() && !(a && a.tagName === 'BUTTON' && !v.contains(a));
    };
    const down = e => { if (e.code === 'Space' && keyOk()) { e.preventDefault(); setSpaceDown(true); } };
    const up = e => { if (e.code === 'Space') setSpaceDown(false); };
    const blur = () => setSpaceDown(false);
    v.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      v.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  const startPan = e => {
    e.preventDefault();
    const v = viewRef.current;
    const sx = e.clientX, sy = e.clientY, l = v.scrollLeft, t = v.scrollTop;
    setPanning(true);
    track(m => { v.scrollLeft = l - (m.clientX - sx); v.scrollTop = t - (m.clientY - sy); }, () => setPanning(false));
  };

  const startMove = (e, id) => {
    const L = live.current;
    let ids = L.selectedIds;
    if (e.shiftKey) {
      ids = ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id];
      L.onSelect(ids);
      if (!ids.includes(id)) return;
    } else if (!ids.includes(id)) {
      ids = [id];
      L.onSelect(ids);
    }
    const origin = new Map(L.objects.filter(o => ids.includes(o.id)).map(o => [o.id, o]));
    const b0 = unionOf([...origin.values()]);
    const start = toScene(e);
    const collapse = !e.shiftKey && ids.length > 1;
    let moved = false;
    track(m => {
      const [px, py] = toScene(m);
      let dx = px - start[0], dy = py - start[1];
      if (!moved && Math.hypot(dx, dy) * live.current.zoom < 3) return;
      moved = true;
      const sc = live.current.scene;
      dx = snapAxis(b0.l + dx, b0.r - b0.l, sc.width) - b0.l;
      dy = snapAxis(b0.t + dy, b0.b - b0.t, sc.height) - b0.t;
      L.onObjects(os => os.map(o => {
        const s = origin.get(o.id);
        return s ? { ...o, x: rnd(s.x + dx), y: rnd(s.y + dy) } : o;
      }));
    }, () => { if (!moved && collapse) L.onSelect([id]); });
  };

  const startResize = (e, dir) => {
    const L = live.current;
    const o0 = L.objects.find(o => o.id === L.selectedIds[0]);
    if (!o0) return;
    const [, dx, dy] = HANDLES.find(h => h[0] === dir);
    const cx = o0.x + o0.width / 2, cy = o0.y + o0.height / 2;
    const [hx, hy] = rotate((dx * o0.width) / 2, (dy * o0.height) / 2, o0.rotation);
    const h0 = [cx + hx, cy + hy];
    const p0 = toScene(e);
    const grab = [p0[0] - h0[0], p0[1] - h0[1]];
    track(m => {
      const sc = live.current.scene;
      const [px, py] = toScene(m);
      const tx = snapAxis(px - grab[0], 0, sc.width), ty = snapAxis(py - grab[1], 0, sc.height);
      const [lx, ly] = rotate(tx - h0[0], ty - h0[1], -o0.rotation);
      const w = Math.max(MIN, o0.width + dx * lx), h = Math.max(MIN, o0.height + dy * ly);
      const [ox, oy] = rotate((dx * (w - o0.width)) / 2, (dy * (h - o0.height)) / 2, o0.rotation);
      L.onObjects(os => os.map(o => (o.id === o0.id
        ? { ...o, width: rnd(w), height: rnd(h), x: rnd(cx + ox - w / 2), y: rnd(cy + oy - h / 2) }
        : o)));
    });
  };

  const startRotate = e => {
    const L = live.current;
    const o0 = L.objects.find(o => o.id === L.selectedIds[0]);
    if (!o0) return;
    const cx = o0.x + o0.width / 2, cy = o0.y + o0.height / 2;
    const angleOf = ([px, py]) => (Math.atan2(py - cy, px - cx) * 180) / Math.PI;
    const grab = angleOf(toScene(e)) - o0.rotation;
    const apply = m => {
      const p = toScene(m);
      let r = angleOf(p) - grab;
      r = ((((r + 180) % 360) + 360) % 360) - 180;
      r = m.shiftKey ? rnd(r / 15) * 15 : rnd(r);
      setRotating({ angle: r, x: p[0], y: p[1] });
      L.onObjects(os => os.map(o => (o.id === o0.id ? { ...o, rotation: r } : o)));
    };
    apply(e);
    track(apply, () => setRotating(null));
  };

  const startMarquee = e => {
    const L = live.current;
    const base = e.shiftKey ? L.selectedIds : [];
    if (!e.shiftKey) L.onSelect([]);
    const p0 = toScene(e);
    track(m => {
      const [px, py] = toScene(m);
      const r = { l: Math.min(p0[0], px), t: Math.min(p0[1], py), r: Math.max(p0[0], px), b: Math.max(p0[1], py) };
      setMarquee(r);
      const hit = live.current.objects.filter(o => {
        const b = boundsOf(o);
        return b.l < r.r && b.r > r.l && b.t < r.b && b.b > r.t;
      }).map(o => o.id);
      L.onSelect([...new Set([...base, ...hit])]);
    }, () => setMarquee(null));
  };

  const onPointerDown = e => {
    const v = viewRef.current;
    if (e.button === 1 || (e.button === 0 && live.current.spaceDown)) return startPan(e);
    if (e.button !== 0) return;
    if (e.target === v && (e.offsetX > v.clientWidth || e.offsetY > v.clientHeight)) return;
    if (e.target.closest('[data-rotate]')) return startRotate(e);
    const handle = e.target.closest('[data-handle]');
    if (handle) return startResize(e, handle.dataset.handle);
    const el = e.target.closest('[data-id]');
    if (el) return startMove(e, el.dataset.id);
    startMarquee(e);
  };

  const accepts = e => Array.from(e.dataTransfer.types).includes(NEW_BLOCK);
  const selected = objects.filter(o => selectedIds.includes(o.id));
  const single = selected.length === 1;

  return (
    <div
      ref={viewRef}
      className={`viewport${spaceDown ? ' pan' : ''}${panning ? ' panning' : ''}${over ? ' over' : ''}`}
      onPointerDown={onPointerDown}
      onMouseDown={e => { if (e.button === 1) e.preventDefault(); }}
      onDragOver={e => {
        if (!accepts(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setOver(true);
      }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(false); }}
      onDrop={e => {
        e.preventDefault();
        setOver(false);
        const type = e.dataTransfer.getData(NEW_BLOCK);
        if (type) { const [x, y] = toScene(e); onInsert(type, x, y); }
      }}
    >
      <div className="frame" style={{ width: scene.width * zoom + PAD * 2, height: scene.height * zoom + PAD * 2 }}>
        <div
          ref={wrapRef}
          className="wrap"
          style={{ left: PAD, top: PAD, width: scene.width, height: scene.height, transform: `scale(${zoom})` }}
        >
          <div className="scene">
            {objects.map(o => <ObjectView key={o.id} o={o} />)}
          </div>
          <div className="overlay" style={{ '--u': 1 / zoom }}>
            {snapGrid && <div className="grid-layer" />}
            {objects.length === 0 && <div className="hint">Drag a block here</div>}
            {selected.map(o => (
              <div
                key={o.id}
                className="sel-box"
                style={{ left: o.x, top: o.y, width: o.width, height: o.height, transform: `rotate(${o.rotation}deg)` }}
              >
                {single && <i className="rot-stem" />}
                {single && <i data-rotate className="rot-handle" />}
                {single && HANDLES.map(([k, dx, dy]) => (
                  <i
                    key={k}
                    data-handle={k}
                    className="handle"
                    style={{ left: `${(dx + 1) * 50}%`, top: `${(dy + 1) * 50}%`, cursor: CURSORS[k] }}
                  />
                ))}
              </div>
            ))}
            {rotating && (
              <div className="angle-badge" style={{ left: rotating.x, top: rotating.y }}>{rotating.angle}°</div>
            )}
            {marquee && (
              <div
                className="marquee"
                style={{ left: marquee.l, top: marquee.t, width: marquee.r - marquee.l, height: marquee.b - marquee.t }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default Canvas;
