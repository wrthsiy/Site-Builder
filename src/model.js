export const SCENE_DEFAULT = { width: 1200, height: 800 };
export const GRID = 8;
export const MIN_SIZE = 4;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3;
export const GEO_KEYS = ['x', 'y', 'width', 'height', 'rotation', 'zIndex'];

export const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300'><rect width='100%' height='100%' fill='#374151'/>" +
  "<text x='50%' y='50%' fill='#9ca3af' font-family='sans-serif' font-size='28' text-anchor='middle' dominant-baseline='middle'>Image</text></svg>"
);

export const TEXTURES = {
  dots: { image: 'radial-gradient(rgba(128,128,128,.3) 1.5px,transparent 1.5px)', size: '16px 16px' },
  stripes: { image: 'repeating-linear-gradient(45deg,rgba(128,128,128,.25) 0 8px,transparent 8px 16px)', size: 'auto' },
  grid: {
    image: 'linear-gradient(rgba(128,128,128,.25) 1px,transparent 1px),linear-gradient(90deg,rgba(128,128,128,.25) 1px,transparent 1px)',
    size: '20px 20px',
  },
  checker: { image: 'conic-gradient(rgba(128,128,128,.25) 25%,transparent 0 50%,rgba(128,128,128,.25) 0 75%,transparent 0)', size: '24px 24px' },
};

const YT_ID = /^[\w-]{11}$/;
const YT_URL = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})(?![\w-])/;
export const DIRECT_VIDEO = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;

export function parseYouTubeId(input) {
  const s = String(input || '').trim();
  if (YT_ID.test(s)) return s;
  const m = YT_URL.exec(s);
  return m ? m[1] : null;
}

export const isHttpUrl = s => /^https?:\/\//i.test(String(s || '').trim());

export function fieldError({ type, props }, key) {
  if (type === 'video' && key === 'src') {
    const s = (props.src || '').trim();
    if (s && !parseYouTubeId(s) && !DIRECT_VIDEO.test(s)) return 'Unrecognized YouTube URL';
  }
  if (type === 'embed' && key === 'url') {
    const s = (props.url || '').trim();
    if (s && !isHttpUrl(s)) return 'Enter a full http(s) URL';
  }
  return '';
}

export const BLOCK_TYPES = [
  { type: 'button', label: 'Button', icon: '▭' },
  { type: 'heading', label: 'Heading', icon: 'H' },
  { type: 'text', label: 'Text', icon: '¶' },
  { type: 'image', label: 'Image', icon: '▣' },
  { type: 'box', label: 'Box', icon: '■' },
  { type: 'divider', label: 'Divider', icon: '—' },
  { type: 'link', label: 'Link', icon: '↗' },
  { type: 'input', label: 'Input', icon: 'I' },
  { type: 'list', label: 'List', icon: '☰' },
  { type: 'video', label: 'Video', icon: '▶' },
  { type: 'badge', label: 'Badge', icon: '●' },
  { type: 'emoji', label: 'Emoji', icon: '☺' },
  { type: 'quote', label: 'Quote', icon: '❝' },
  { type: 'textarea', label: 'Text area', icon: '¶¶' },
  { type: 'embed', label: 'Embed page', icon: '⧉' },
  { type: 'circle', label: 'Circle', icon: '◯' },
];

const SIZES = {
  button: [160, 48], heading: [360, 80], text: [320, 120], image: [300, 200],
  box: [240, 160], divider: [400, 16], link: [160, 32], input: [280, 44], list: [280, 140], video: [480, 270],
  badge: [96, 32], emoji: [96, 96], quote: [360, 120], textarea: [280, 120], embed: [480, 320], circle: [160, 160],
};

const BASE_PROPS = {
  bgType: 'none', bg: '#e5e7eb', g1: '#4f8cff', g2: '#9b5cff', dir: '135deg',
  tex: 'dots', bgUrl: '',
  padding: 0, radius: 0, align: 'left', color: '#111827', size: 18,
};

const TYPE_DEFAULTS = {
  button: { text: 'Click me', action: "alert('Hello!')", btnBg: '#4f8cff', btnRadius: 8, color: '#ffffff', size: 16 },
  heading: { text: 'Your heading', tag: 'h1', size: 36, padding: 8 },
  text: { text: 'Write something here…', padding: 8 },
  image: { src: PLACEHOLDER, alt: 'Image', fit: 'cover' },
  box: { bgType: 'solid', bg: '#4f8cff', radius: 12 },
  divider: { thickness: 2, lineStyle: 'solid', color: '#9ca3af' },
  link: { text: 'Visit link', href: 'https://example.com', newTab: 'yes', underline: 'yes', color: '#2563eb', size: 18 },
  input: { ph: 'Type here…', inputType: 'text', btnRadius: 8, size: 16 },
  list: { text: 'First item\nSecond item\nThird item', listType: 'ul', padding: 8 },
  video: { src: '', fit: 'contain' },
  badge: { text: 'NEW', bgType: 'solid', bg: '#4f8cff', color: '#ffffff', radius: 999, size: 14, align: 'center', padding: 4 },
  emoji: { text: '😀', size: 64, align: 'center' },
  quote: { text: 'Design is not just what it looks like. It is how it works.', author: 'Someone wise', btnBg: '#4f8cff', size: 20, padding: 8 },
  textarea: { ph: 'Your message…', btnRadius: 8, size: 16 },
  embed: { url: '', title: 'Embedded page' },
  circle: { bgType: 'solid', bg: '#9b5cff' },
};

const newId = () => Math.random().toString(36).slice(2, 10);

export const createBlock = (type, cx, cy, zIndex) => {
  const [width, height] = SIZES[type];
  return {
    id: newId(), type,
    x: Math.round(cx - width / 2), y: Math.round(cy - height / 2),
    width, height, rotation: 0, zIndex,
    props: { ...BASE_PROPS, ...TYPE_DEFAULTS[type] },
  };
};

export const cloneBlock = (o, dx, dy, zIndex) => ({
  ...o, id: newId(), x: o.x + dx, y: o.y + dy, zIndex, props: { ...o.props },
});

export const getValue = (o, key) => (GEO_KEYS.includes(key) ? o[key] : o.props[key]);

export function patchObject(o, patch) {
  const next = { ...o, props: { ...o.props } };
  for (const [k, v] of Object.entries(patch)) {
    if (GEO_KEYS.includes(k)) next[k] = v;
    else next.props[k] = v;
  }
  next.width = Math.max(MIN_SIZE, next.width);
  next.height = Math.max(MIN_SIZE, next.height);
  return next;
}

const field = (key, label, kind, extra) => ({ key, label, kind, ...extra });
const alignField = field('align', 'Align', 'select', { options: ['left', 'center', 'right'] });

const GEO_FIELDS = [
  field('x', 'X', 'number', { geo: true }),
  field('y', 'Y', 'number', { geo: true }),
  field('width', 'W', 'number', { geo: true }),
  field('height', 'H', 'number', { geo: true }),
  field('zIndex', 'Z-index', 'number', { geo: true }),
  field('rotation', 'Rotation (°)', 'angle', { geo: true, wide: true }),
];

const TYPE_FIELDS = {
  button: [
    field('text', 'Label', 'text'),
    field('action', 'Action (JS code)', 'area'),
    field('btnBg', 'Button color', 'color'),
    field('color', 'Label color', 'color'),
    field('btnRadius', 'Button radius', 'range', { min: 0, max: 60 }),
    field('size', 'Font size', 'range', { min: 10, max: 64 }),
  ],
  heading: [
    field('text', 'Text', 'area'),
    field('tag', 'Level', 'select', { options: ['h1', 'h2', 'h3'] }),
    field('color', 'Color', 'color'),
    field('size', 'Font size', 'range', { min: 16, max: 120 }),
    alignField,
  ],
  text: [
    field('text', 'Text', 'area'),
    field('color', 'Color', 'color'),
    field('size', 'Font size', 'range', { min: 12, max: 48 }),
    alignField,
  ],
  image: [
    field('src', 'Image', 'image'),
    field('alt', 'Alt text', 'text'),
    field('fit', 'Fit', 'select', { options: ['cover', 'contain', 'fill'] }),
  ],
};

const TYPE_FIELDS_MORE = {
  box: [],
  divider: [
    field('thickness', 'Thickness', 'range', { min: 1, max: 20 }),
    field('lineStyle', 'Line style', 'select', { options: ['solid', 'dashed', 'dotted'] }),
    field('color', 'Color', 'color'),
  ],
  link: [
    field('text', 'Text', 'text'),
    field('href', 'URL', 'text'),
    field('newTab', 'Open in new tab', 'select', { options: [['yes', 'Yes'], ['no', 'No']] }),
    field('underline', 'Underline', 'select', { options: [['yes', 'Yes'], ['no', 'No']] }),
    field('color', 'Color', 'color'),
    field('size', 'Font size', 'range', { min: 10, max: 64 }),
    alignField,
  ],
  input: [
    field('ph', 'Placeholder', 'text'),
    field('inputType', 'Type', 'select', { options: ['text', 'email', 'password', 'number', 'tel'] }),
    field('color', 'Text color', 'color'),
    field('btnRadius', 'Field radius', 'range', { min: 0, max: 40 }),
    field('size', 'Font size', 'range', { min: 10, max: 32 }),
  ],
  list: [
    field('text', 'Items (one per line)', 'area'),
    field('listType', 'Style', 'select', { options: [['ul', 'Bullets'], ['ol', 'Numbers'], ['none', 'Plain']] }),
    field('color', 'Color', 'color'),
    field('size', 'Font size', 'range', { min: 10, max: 48 }),
  ],
  video: [
    field('src', 'YouTube URL / ID (or .mp4 URL)', 'text'),
    field('fit', 'Fit (file videos)', 'select', { options: ['contain', 'cover', 'fill'] }),
  ],
  badge: [
    field('text', 'Text', 'text'),
    field('color', 'Text color', 'color'),
    field('size', 'Font size', 'range', { min: 8, max: 48 }),
  ],
  emoji: [
    field('text', 'Emoji', 'text'),
    field('size', 'Size', 'range', { min: 16, max: 300 }),
  ],
  quote: [
    field('text', 'Quote', 'area'),
    field('author', 'Author', 'text'),
    field('btnBg', 'Accent color', 'color'),
    field('color', 'Text color', 'color'),
    field('size', 'Font size', 'range', { min: 10, max: 64 }),
  ],
  textarea: [
    field('ph', 'Placeholder', 'text'),
    field('color', 'Text color', 'color'),
    field('btnRadius', 'Field radius', 'range', { min: 0, max: 40 }),
    field('size', 'Font size', 'range', { min: 10, max: 32 }),
  ],
  embed: [
    field('url', 'Page URL (https://…)', 'text'),
    field('title', 'Title (accessibility)', 'text'),
  ],
  circle: [],
};
Object.assign(TYPE_FIELDS, TYPE_FIELDS_MORE);

const DIRECTIONS = [
  ['135deg', 'Diagonal ↘'], ['45deg', 'Diagonal ↗'], ['to bottom', 'Top → bottom'],
  ['to top', 'Bottom → top'], ['to right', 'Left → right'], ['to left', 'Right → left'],
];

const BG_EXTRA = {
  none: [],
  solid: [field('bg', 'Color', 'color')],
  gradient: [
    field('g1', 'Color 1', 'color'),
    field('g2', 'Color 2', 'color'),
    field('dir', 'Direction', 'select', { options: DIRECTIONS }),
  ],
  texture: [
    field('tex', 'Pattern', 'select', { options: Object.keys(TEXTURES) }),
    field('bg', 'Base color', 'color'),
  ],
  image: [field('bgUrl', 'Background image', 'image')],
};

export const SCENE_FIELDS = [
  field('width', 'Scene width', 'number'),
  field('height', 'Scene height', 'number'),
];

export const fieldsFor = ({ type, props }) => [
  ...GEO_FIELDS,
  ...TYPE_FIELDS[type],
  field('bgType', 'Background', 'select', {
    options: [['none', 'None'], ['solid', 'Solid color'], ['gradient', 'Gradient'],
      ['texture', 'Texture'], ['image', 'Image']],
  }),
  ...BG_EXTRA[props.bgType],
  field('padding', 'Padding', 'range', { min: 0, max: 120 }),
  ...(type === 'circle' ? [] : [field('radius', 'Corner radius', 'range', { min: 0, max: 100 })]),
];
