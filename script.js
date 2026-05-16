// ── CONFIG ──────────────────────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Sat'];

const SLOTS = [
  '08:00 – 09:30',
  '09:40 – 11:10',
  '11:20 – 12:50',
  '13:00 – 14:30',
  '14:40 – 16:10',
  '16:20 – 17:50'
];

const COLORS = [
  { bg: '#c8e6c9', border: '#388e3c', text: '#1b5e20' }, // green
  { bg: '#bbdefb', border: '#1976d2', text: '#0d47a1' }, // blue
  { bg: '#ffe0b2', border: '#f57c00', text: '#e65100' }, // orange
  { bg: '#f8bbd0', border: '#c2185b', text: '#880e4f' }, // pink
  { bg: '#e1bee7', border: '#7b1fa2', text: '#4a148c' }, // purple
  { bg: '#b2dfdb', border: '#00796b', text: '#004d40' }, // teal
  { bg: '#fff9c4', border: '#f9a825', text: '#f57f17' }, // yellow
  { bg: '#ffccbc', border: '#e64a19', text: '#bf360c' }, // deep-orange
];

// Day group → column indices into DAYS array
// DAYS = ['Mon'(0), 'Tue'(1), 'Wed'(2), 'Thu'(3), 'Sat'(4)]
const DAY_MAP = {
  MW: [0, 2],   // Mon & Wed
  ST: [4, 1],   // Sat & Tue
  AR: [3, 4],   // Thu & Sat
};

let courses = [];

// ── AUTO COLOR ───────────────────────────────────────────
function nextColor() {
  const used = new Set(courses.map(c => c.color));
  for (let i = 0; i < COLORS.length; i++) {
    if (!used.has(i)) return i;
  }
  const counts = Array(COLORS.length).fill(0);
  courses.forEach(c => counts[c.color]++);
  return counts.indexOf(Math.min(...counts));
}

// ── ADD COURSE ───────────────────────────────────────────
function addCourse() {
  const name = document.getElementById('courseName').value.trim().toUpperCase();
  const room = document.getElementById('courseRoom').value.trim().toUpperCase();
  const days = document.getElementById('courseDays').value;
  const slot = parseInt(document.getElementById('courseSlot').value);

  if (!name) { alert('Please enter a course name.'); return; }

  courses.push({ name, room, days, slot, color: nextColor() });
  renderTags();
  drawSchedule();
  document.getElementById('courseName').value = '';
  document.getElementById('courseRoom').value = '';
}

function removeCourse(i) {
  courses.splice(i, 1);
  renderTags();
  drawSchedule();
}

function clearAll() {
  courses = [];
  renderTags();
  drawSchedule();
}

// ── ENTRY TAGS ───────────────────────────────────────────
function renderTags() {
  const list = document.getElementById('entryList');
  list.innerHTML = '';
  courses.forEach((c, i) => {
    const col = COLORS[c.color];
    const tag = document.createElement('div');
    tag.className = 'entry-tag';
    tag.style.borderColor = col.border;
    tag.style.background = col.bg;
    tag.style.color = col.text;
    const roomPart = c.room ? ` · ${c.room}` : '';
    tag.innerHTML = `
      <span>${c.name}</span>
      <span style="font-weight:400;opacity:0.7">${c.days}${roomPart} · ${SLOTS[c.slot].split('–')[0].trim()}</span>
      <span class="remove-btn" onclick="removeCourse(${i})">✕</span>
    `;
    list.appendChild(tag);
  });
}

// ── CANVAS ───────────────────────────────────────────────
const canvas = document.getElementById('scheduleCanvas');
const ctx = canvas.getContext('2d');

function drawSchedule() {
  const W = 960, H = 620;
  canvas.width = W;
  canvas.height = H;

  const PAD    = 28;
  const TIME_W = 110;
  const cols   = DAYS.length;
  const COL_W  = (W - PAD * 2 - TIME_W) / cols;

  // ── Background ──
  ctx.fillStyle = '#d6d6d6';
  ctx.fillRect(0, 0, W, H);

  // Diagonal decorative polygons (top-left)
  [
    { pts: [[0,0],[220,0],[320,140],[0,200]], color: '#c0c0c0' },
    { pts: [[0,0],[140,0],[220,100],[0,130]], color: '#b8b8b8' },
    { pts: [[0,160],[180,0],[260,0],[0,240]], color: '#cacaca', alpha: 0.5 },
  ].forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha || 1;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    p.pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // ── Title area ──
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 0, 0, W * 0.5, PAD + 60, 0);
  ctx.fill();

  ctx.font = 'bold 36px Nunito, sans-serif';
  ctx.fillStyle = '#2e2e2e';
  ctx.fillText('Class Schedule', PAD, 48);

  // ── Name / Dept boxes (top-right) ──
  const boxX = W * 0.55, boxY = PAD - 4, boxW = W * 0.38, boxH = 24;
  const studentName = document.getElementById('studentName').value.trim();
  const studentDept = document.getElementById('studentDept').value.trim();

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, boxX, boxY, boxW, boxH); ctx.fill();
  ctx.fillStyle = '#e0e0e0';
  roundRect(ctx, boxX, boxY + boxH + 4, boxW, boxH); ctx.fill();

  ctx.font = '600 13px Nunito Sans, sans-serif';
  ctx.fillStyle = '#555';
  ctx.fillText('Name:  ' + (studentName || ''), boxX + 10, boxY + 17);
  ctx.fillText('Dept:  ' + (studentDept || ''), boxX + 10, boxY + boxH + 4 + 17);

  // ── Table ──
  const TX = PAD, TY = PAD + 68;
  const TW = W - PAD * 2, TH = H - TY - PAD;
  const rowH = TH / (SLOTS.length + 1);

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, TX, TY, TW, TH, 6); ctx.fill();

  // Header row
  ctx.fillStyle = '#3a3a3a';
  roundRectTop(ctx, TX, TY, TW, rowH, 6); ctx.fill();

  const headers = ['Time', ...DAYS];
  const colWidths = [TIME_W, ...Array(cols).fill(COL_W)];
  let cx = TX;
  headers.forEach((h, hi) => {
    const cw = colWidths[hi];
    ctx.font = 'bold 14px Nunito, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(h, cx + cw / 2, TY + rowH / 2 + 5);
    cx += cw;
  });

  // Row alternating backgrounds
  SLOTS.forEach((_, si) => {
    const ry = TY + rowH * (si + 1);
    ctx.fillStyle = si % 2 === 0 ? '#f5f5f5' : '#ebebeb';
    if (si === SLOTS.length - 1) {
      roundRectBottom(ctx, TX, ry, TW, rowH, 6); ctx.fill();
    } else {
      ctx.fillRect(TX, ry, TW, rowH);
    }
  });

  // Grid lines
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  for (let r = 1; r <= SLOTS.length; r++) {
    const ry = TY + rowH * r;
    ctx.beginPath(); ctx.moveTo(TX, ry); ctx.lineTo(TX + TW, ry); ctx.stroke();
  }
  let vx = TX;
  colWidths.forEach(cw => {
    vx += cw;
    if (vx < TX + TW) {
      ctx.beginPath(); ctx.moveTo(vx, TY); ctx.lineTo(vx, TY + TH); ctx.stroke();
    }
  });

  // Table border
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(TX, TY, TW, TH);

  // Time labels
  SLOTS.forEach((slot, si) => {
    const ry = TY + rowH * (si + 1);
    const [t1, t2] = slot.split('–');
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Nunito, sans-serif';
    ctx.fillStyle = '#2e2e2e';
    ctx.fillText(t1.trim(), TX + TIME_W / 2, ry + rowH * 0.38);
    ctx.font = '600 12px Nunito Sans, sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText('– ' + t2.trim(), TX + TIME_W / 2, ry + rowH * 0.65);
  });

  // ── Draw courses ──
  courses.forEach(c => {
    const colIdxs = DAY_MAP[c.days] || [];
    colIdxs.forEach(ci => {
      const cellX = TX + TIME_W + COL_W * ci + 4;
      const cellY = TY + rowH * (c.slot + 1) + 4;
      const cellW = COL_W - 8;
      const cellH = rowH - 8;
      const col = COLORS[c.color];

      // Background
      ctx.fillStyle = col.bg;
      roundRect(ctx, cellX, cellY, cellW, cellH, 5); ctx.fill();

      // Left accent bar
      ctx.fillStyle = col.border;
      roundRect(ctx, cellX, cellY, 5, cellH, [3, 0, 0, 3]); ctx.fill();

      // Course name
      ctx.font = 'bold 12px Nunito, sans-serif';
      ctx.fillStyle = col.text;
      ctx.textAlign = 'center';
      ctx.fillText(c.name, cellX + cellW / 2 + 2, cellY + cellH * (c.room ? 0.38 : 0.55));

      // Room (if provided)
      if (c.room) {
        ctx.font = '600 10px Nunito Sans, sans-serif';
        ctx.fillStyle = col.text;
        ctx.globalAlpha = 0.7;
        ctx.fillText(c.room, cellX + cellW / 2 + 2, cellY + cellH * 0.65);
        ctx.globalAlpha = 1;
      }
    });
  });

  ctx.textAlign = 'left';
}

// ── ROUNDED RECT HELPERS ──────────────────────────────────
function roundRect(ctx, x, y, w, h, r = 6) {
  if (typeof r === 'number') r = [r, r, r, r];
  const [tl, tr, br, bl] = r;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y); ctx.arcTo(x + w, y,   x + w, y + tr,   tr);
  ctx.lineTo(x + w, y + h - br); ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h); ctx.arcTo(x, y + h,   x, y + h - bl,   bl);
  ctx.lineTo(x, y + tl); ctx.arcTo(x, y,       x + tl, y,     tl);
  ctx.closePath();
}

function roundRectTop(ctx, x, y, w, h, r) {
  roundRect(ctx, x, y, w, h, [r, r, 0, 0]);
}

function roundRectBottom(ctx, x, y, w, h, r) {
  roundRect(ctx, x, y, w, h, [0, 0, r, r]);
}

// ── DOWNLOAD ─────────────────────────────────────────────
function downloadPNG() {
  const link = document.createElement('a');
  link.download = 'class_schedule.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ── LIVE REDRAW ──────────────────────────────────────────
document.getElementById('studentName').addEventListener('input', drawSchedule);
document.getElementById('studentDept').addEventListener('input', drawSchedule);

// Initial draw
drawSchedule();
