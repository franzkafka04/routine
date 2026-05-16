// ── CONFIG ──────────────────────────────────────────────
// Columns: Sun(0), Mon(1), Tue(2), Wed(3), Thu(4), Sat(5)
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Sat'];

const SLOTS = [
  '08:00 – 09:30',
  '09:40 – 11:10',
  '11:20 – 12:50',
  '13:00 – 14:30',
  '14:40 – 16:10',
  '16:20 – 17:50'
];

const COLORS = [
  { bg: '#e8f5e9', border: '#43a047', text: '#2e7d32' },
  { bg: '#e3f2fd', border: '#1e88e5', text: '#1565c0' },
  { bg: '#fff3e0', border: '#fb8c00', text: '#e65100' },
  { bg: '#fce4ec', border: '#e91e63', text: '#880e4f' },
  { bg: '#f3e5f5', border: '#8e24aa', text: '#4a148c' },
  { bg: '#e0f2f1', border: '#00897b', text: '#004d40' },
  { bg: '#fffde7', border: '#fdd835', text: '#f57f17' },
  { bg: '#fbe9e7', border: '#f4511e', text: '#bf360c' },
];

// MW=Mon&Wed → cols 1,3 | ST=Sun&Tue → cols 0,2 | AR=Thu&Sat → cols 4,5
const DAY_MAP = { MW: [1, 3], ST: [0, 2], AR: [4, 5] };

let courses = [];

function nextColor() {
  const used = new Set(courses.map(c => c.color));
  for (let i = 0; i < COLORS.length; i++) if (!used.has(i)) return i;
  const counts = Array(COLORS.length).fill(0);
  courses.forEach(c => counts[c.color]++);
  return counts.indexOf(Math.min(...counts));
}

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

function rr(x, y, w, h, r = 8) {
  if (typeof r === 'number') r = [r, r, r, r];
  const [tl, tr, br, bl] = r;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);   ctx.arcTo(x+w, y,   x+w, y+tr,   tr);
  ctx.lineTo(x + w, y+h-br);   ctx.arcTo(x+w, y+h, x+w-br, y+h, br);
  ctx.lineTo(x + bl, y + h);   ctx.arcTo(x, y+h,   x, y+h-bl,   bl);
  ctx.lineTo(x, y + tl);       ctx.arcTo(x, y,     x+tl, y,     tl);
  ctx.closePath();
}

function fillRR(x, y, w, h, r, color) {
  ctx.fillStyle = color;
  rr(x, y, w, h, r);
  ctx.fill();
}

function fitText(text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 1 && ctx.measureText(text + '…').width > maxW)
    text = text.slice(0, -1);
  return text + '…';
}

function drawSchedule() {
  const W = 1020, H = 640;
  canvas.width  = W;
  canvas.height = H;

  const PAD       = 24;
  const HDR_H     = 72;
  const TIME_W    = 96;
  const cols      = DAYS.length;
  const COL_W     = (W - PAD * 2 - TIME_W) / cols;
  const TX        = PAD;
  const TY        = PAD + HDR_H + 16;
  const TW        = W - PAD * 2;
  const TH        = H - TY - PAD;
  const COL_HDR_H = 36;
  const ROW_H     = (TH - COL_HDR_H) / SLOTS.length;

  // Background
  ctx.fillStyle = '#f7f8fa';
  ctx.fillRect(0, 0, W, H);

  // Top accent strip
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, 4);

  // Title
  ctx.font = 'bold 28px Nunito, sans-serif';
  ctx.fillStyle = '#1a1a2e';
  ctx.textAlign = 'left';
  ctx.fillText('Class Schedule', PAD, PAD + 32);
  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(PAD, PAD + 38, 48, 3);

  // Name / Dept pills
  const studentName = document.getElementById('studentName').value.trim();
  const studentDept = document.getElementById('studentDept').value.trim();
  const pillX = W * 0.52, pillW = W - (W * 0.52) - PAD;

  [[PAD + 4, 'NAME', studentName], [PAD + 36, 'DEPT', studentDept]].forEach(([py, lbl, val]) => {
    fillRR(pillX, py, pillW, 26, 6, '#ffffff');
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
    rr(pillX, py, pillW, 26, 6); ctx.stroke();
    ctx.font = '600 11px Nunito Sans, sans-serif';
    ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'left';
    ctx.fillText(lbl, pillX + 10, py + 17);
    ctx.font = '700 12px Nunito Sans, sans-serif';
    ctx.fillStyle = '#1a1a2e'; ctx.textAlign = 'right';
    ctx.fillText(val || '—', pillX + pillW - 10, py + 17);
  });

  // Table card
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.07)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  fillRR(TX, TY, TW, TH, 12, '#ffffff');
  ctx.restore();
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
  rr(TX, TY, TW, TH, 12); ctx.stroke();

  // Column header
  fillRR(TX, TY, TW, COL_HDR_H, [12, 12, 0, 0], '#1a1a2e');

  const colWidths = [TIME_W, ...Array(cols).fill(COL_W)];
  let cx = TX;
  ['', ...DAYS].forEach((h, hi) => {
    const cw = colWidths[hi];
    ctx.font = 'bold 12px Nunito, sans-serif';
    ctx.fillStyle = hi === 0 ? 'rgba(255,255,255,0.3)' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(h, cx + cw / 2, TY + COL_HDR_H / 2 + 5);
    cx += cw;
  });

  // Row stripes
  SLOTS.forEach((_, si) => {
    const ry = TY + COL_HDR_H + ROW_H * si;
    ctx.fillStyle = si % 2 === 0 ? '#ffffff' : '#f9fafb';
    if (si === SLOTS.length - 1) { rr(TX, ry, TW, ROW_H, [0, 0, 12, 12]); }
    else { ctx.beginPath(); ctx.rect(TX, ry, TW, ROW_H); }
    ctx.fill();
  });

  // Grid lines
  ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1;
  for (let r = 1; r < SLOTS.length; r++) {
    const ry = TY + COL_HDR_H + ROW_H * r;
    ctx.beginPath(); ctx.moveTo(TX + 1, ry); ctx.lineTo(TX + TW - 1, ry); ctx.stroke();
  }
  let vx = TX;
  colWidths.forEach((cw, i) => {
    vx += cw;
    if (i < colWidths.length - 1) {
      ctx.beginPath(); ctx.moveTo(vx, TY + COL_HDR_H); ctx.lineTo(vx, TY + TH); ctx.stroke();
    }
  });

  // Header separator
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(TX, TY + COL_HDR_H); ctx.lineTo(TX + TW, TY + COL_HDR_H); ctx.stroke();

  // Time labels
  SLOTS.forEach((slot, si) => {
    const ry = TY + COL_HDR_H + ROW_H * si;
    const [t1, t2] = slot.split('–');
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px Nunito, sans-serif';
    ctx.fillStyle = '#374151';
    ctx.fillText(t1.trim(), TX + TIME_W / 2, ry + ROW_H * 0.4);
    ctx.font = '500 10px Nunito Sans, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(t2.trim(), TX + TIME_W / 2, ry + ROW_H * 0.66);
  });

  // Course cells
  courses.forEach(c => {
    (DAY_MAP[c.days] || []).forEach(ci => {
      const cellX = TX + TIME_W + COL_W * ci + 5;
      const cellY = TY + COL_HDR_H + ROW_H * c.slot + 5;
      const cellW = COL_W - 10;
      const cellH = ROW_H - 10;
      const col   = COLORS[c.color];

      fillRR(cellX, cellY, cellW, cellH, 7, col.bg);
      fillRR(cellX, cellY, cellW, 3, [7, 7, 0, 0], col.border);

      ctx.font = 'bold 12px Nunito, sans-serif';
      ctx.fillStyle = col.text;
      ctx.textAlign = 'center';
      const nameY = c.room ? cellY + cellH * 0.42 : cellY + cellH * 0.58;
      ctx.fillText(fitText(c.name, cellW - 10), cellX + cellW / 2, nameY);

      if (c.room) {
        ctx.font = '600 10px Nunito Sans, sans-serif';
        ctx.fillStyle = col.border;
        ctx.globalAlpha = 0.9;
        ctx.fillText(fitText(c.room, cellW - 10), cellX + cellW / 2, cellY + cellH * 0.68);
        ctx.globalAlpha = 1;
      }
    });
  });

  ctx.textAlign = 'left';
}

function downloadPNG() {
  const link = document.createElement('a');
  link.download = 'class_schedule.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

document.getElementById('studentName').addEventListener('input', drawSchedule);
document.getElementById('studentDept').addEventListener('input', drawSchedule);

drawSchedule();
