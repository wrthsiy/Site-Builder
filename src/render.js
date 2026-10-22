import { DIRECT_VIDEO, PLACEHOLDER, TEXTURES, isHttpUrl, parseYouTubeId } from './model.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
const multiline = s => esc(s).replace(/\n/g, '<br>');
const cssUrl = u => `url("${u.trim().replace(/["\\\n\r]/g, c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))}")`;

const JUSTIFY = { left: 'flex-start', center: 'center', right: 'flex-end' };
const FONT = 'system-ui,-apple-system,"Segoe UI",sans-serif';

function backgroundCss(p) {
  switch (p.bgType) {
    case 'solid':
      return `background-color:${p.bg};`;
    case 'gradient':
      return `background-image:linear-gradient(${p.dir},${p.g1},${p.g2});`;
    case 'texture': {
      const t = TEXTURES[p.tex] || TEXTURES.dots;
      return `background-color:${p.bg};background-image:${t.image};background-size:${t.size};`;
    }
    case 'image':
      return p.bgUrl
        ? `background-image:${cssUrl(p.bgUrl)};background-size:cover;background-position:center;background-repeat:no-repeat;`
        : '';
    default:
      return '';
  }
}

const INNER = {
  button: (p, exp) => {
    const onclick = exp && p.action.trim() ? ` onclick="${esc(p.action)}"` : '';
    const style = `width:100%;height:100%;background:${p.btnBg};color:${p.color};border:0;border-radius:${p.btnRadius}px;font:inherit;font-weight:600;cursor:pointer;`;
    return `<button type="button"${onclick} style="${esc(style)}">${multiline(p.text)}</button>`;
  },
  heading: p => {
    const tag = ['h1', 'h2', 'h3'].includes(p.tag) ? p.tag : 'h1';
    return `<${tag} style="margin:0;width:100%;font:inherit;font-weight:700;line-height:1.2;overflow-wrap:anywhere">${multiline(p.text)}</${tag}>`;
  },
  text: p => `<p style="margin:0;width:100%;line-height:1.6;overflow-wrap:anywhere">${multiline(p.text)}</p>`,
  box: () => '',
  divider: p => {
    const st = ['solid', 'dashed', 'dotted'].includes(p.lineStyle) ? p.lineStyle : 'solid';
    return `<hr style="${esc(`width:100%;margin:0;border:0;border-top:${p.thickness}px ${st} ${p.color};`)}">`;
  },
  link: (p, exp) => {
    const target = p.newTab === 'yes' ? ' target="_blank" rel="noopener"' : '';
    const style = `display:block;width:100%;color:inherit;font-weight:600;text-decoration:${p.underline === 'yes' ? 'underline' : 'none'};${inert(exp)}`;
    return `<a href="${esc(p.href)}"${target} style="${esc(style)}">${multiline(p.text)}</a>`;
  },
  input: (p, exp) => {
    const type = ['text', 'email', 'password', 'number', 'tel'].includes(p.inputType) ? p.inputType : 'text';
    const style = `width:100%;height:100%;border:1px solid #d1d5db;border-radius:${p.btnRadius}px;padding:0 12px;font:inherit;color:inherit;background:#fff;${inert(exp)}`;
    return `<input type="${type}" placeholder="${esc(p.ph)}"${exp ? '' : ' tabindex="-1"'} style="${esc(style)}">`;
  },
  list: p => {
    const items = String(p.text).split('\n').filter(l => l.trim()).map(l => `<li>${esc(l)}</li>`).join('');
    const tag = p.listType === 'ol' ? 'ol' : 'ul';
    const pad = p.listType === 'none' ? 'padding-left:0;list-style:none' : 'padding-left:1.4em';
    return `<${tag} style="margin:0;width:100%;line-height:1.6;${pad}">${items}</${tag}>`;
  },
  video: videoHtml,
  embed: embedHtml,
  circle: () => '',
  badge: p => `<span style="width:100%;font-weight:700;letter-spacing:.03em;line-height:1.2;overflow-wrap:anywhere">${multiline(p.text)}</span>`,
  emoji: p => `<div style="width:100%;line-height:1;overflow-wrap:anywhere">${esc(p.text)}</div>`,
  quote: p => {
    const style = `margin:0;width:100%;padding-left:16px;border-left:4px solid ${p.btnBg};font-style:italic;line-height:1.5;overflow-wrap:anywhere`;
    const author = p.author ? `<footer style="margin-top:8px;font-size:.7em;font-style:normal;opacity:.7">— ${esc(p.author)}</footer>` : '';
    return `<blockquote style="${esc(style)}">${multiline(p.text)}${author}</blockquote>`;
  },
  textarea: (p, exp) => {
    const style = `width:100%;height:100%;resize:none;border:1px solid #d1d5db;border-radius:${p.btnRadius}px;padding:10px 12px;font:inherit;color:inherit;background:#fff;${inert(exp)}`;
    return `<textarea placeholder="${esc(p.ph)}"${exp ? '' : ' tabindex="-1"'} style="${esc(style)}"></textarea>`;
  },
  image: p => {
    const fit = ['cover', 'contain', 'fill'].includes(p.fit) ? p.fit : 'cover';
    const style = `width:100%;height:100%;object-fit:${fit};display:block;border-radius:inherit;`;
    return `<img src="${esc(p.src || PLACEHOLDER)}" alt="${esc(p.alt)}" draggable="false" style="${style}">`;
  },
};

const inert = exp => (exp ? '' : 'pointer-events:none;');

const placeholder = (icon, label) =>
  `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#111827;color:#9ca3af;font-size:14px;text-align:center;overflow:hidden"><span style="font-size:40px;color:#fff">${icon}</span><span style="max-width:90%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(label)}</span></div>`;

const YT_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

function videoHtml(p, exp) {
  const src = (p.src || '').trim();
  const id = parseYouTubeId(src);
  if (id) {
    const box = 'width:100%;height:100%;container-type:size;display:flex;align-items:center;justify-content:center;background:#000';
    const ratio = 'position:relative;width:min(100cqw,calc(100cqh*16/9));aspect-ratio:16/9';
    const frame = `position:absolute;inset:0;width:100%;height:100%;border:0;${inert(exp)}`;
    return `<div style="${box}"><div style="${ratio}"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" allow="${YT_ALLOW}" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" style="${frame}"></iframe></div></div>`;
  }
  if (DIRECT_VIDEO.test(src)) {
    const fit = ['contain', 'cover', 'fill'].includes(p.fit) ? p.fit : 'contain';
    return `<video src="${esc(src)}" controls style="${esc(`width:100%;height:100%;object-fit:${fit};background:#000;${inert(exp)}`)}"></video>`;
  }
  return placeholder('▶', src ? 'Unrecognized YouTube URL' : 'Paste a YouTube URL');
}

function embedHtml(p, exp) {
  const url = (p.url || '').trim();
  if (!isHttpUrl(url)) return placeholder('⧉', url ? 'Enter a full http(s) URL' : 'Paste a page URL');
  const style = `width:100%;height:100%;border:0;background:#fff;${inert(exp)}`;
  return `<iframe src="${esc(url)}" title="${esc(p.title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" style="${esc(style)}"></iframe>`;
}

export function objectHtml(o, forExport = false) {
  const p = o.props;
  const style =
    `position:absolute;left:${o.x}px;top:${o.y}px;width:${o.width}px;height:${o.height}px;` +
    `z-index:${o.zIndex};transform:rotate(${o.rotation}deg);transform-origin:50% 50%;box-sizing:border-box;overflow:hidden;` +
    `display:flex;align-items:${o.type === 'text' || o.type === 'list' ? 'flex-start' : 'center'};justify-content:${JUSTIFY[p.align] || 'flex-start'};` +
    `padding:${p.padding}px;border-radius:${o.type === 'circle' ? '50%' : p.radius + 'px'};color:${p.color};font-size:${p.size}px;text-align:${p.align};` +
    backgroundCss(p);
  const attrs = forExport ? '' : ` data-id="${o.id}"`;
  return `<div${attrs} style="${esc(style)}">${INNER[o.type](p, forExport)}</div>`;
}

export const exportDocument = (objects, scene) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>My Site</title>
<style>*{box-sizing:border-box}html,body{margin:0}body{font-family:${FONT};background:#fff}</style>
</head>
<body>
<div style="position:relative;width:${scene.width}px;height:${scene.height}px;margin:0 auto;overflow:hidden;background:#fff">
${objects.map(o => objectHtml(o, true)).join('\n')}
</div>
</body>
</html>`;

export function downloadHtml(html, name = 'site.html') {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
