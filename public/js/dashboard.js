/* ═══════════════════════════════════════════════════════
   SECURESTORE DASHBOARD — Fully Animated 3D Gold Edition
═══════════════════════════════════════════════════════ */
const API = '';
let allFiles = [], currentCategory = 'all';
let currentDownloadFileId = null, currentDownloadFileName = null;
let currentReplaceFileId = null, otpTimerInterval = null, otpExpiresAt = null;

/* ══════════════════════════════════
   THREE.JS ADVANCED 3D SCENE
══════════════════════════════════ */
(function init3D() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1000);
    camera.position.z = 38;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    let mouse = { x: 0, y: 0 };
    addEventListener('mousemove', e => {
        mouse.x = (e.clientX / innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / innerHeight) * 2 + 1;
    });
    addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });

    const meshes = [];
    const sF = [
        () => new THREE.IcosahedronGeometry(0.85, 0),
        () => new THREE.OctahedronGeometry(0.75, 0),
        () => new THREE.TetrahedronGeometry(0.7, 0),
        () => new THREE.TorusGeometry(0.55, 0.2, 6, 12),
        () => new THREE.BoxGeometry(0.7, 0.7, 0.7),
        () => new THREE.TorusKnotGeometry(0.45, 0.15, 48, 8, 2, 3),
    ];
    for (let i = 0; i < 14; i++) {
        const geo = sF[i % sF.length]();
        const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.08 + Math.random() * 0.06, 0.6, 0.22 + Math.random() * 0.1),
            wireframe: true, transparent: true, opacity: 0.06 + Math.random() * 0.06,
        });
        const m = new THREE.Mesh(geo, mat);
        m.position.set((Math.random() - 0.5) * 75, (Math.random() - 0.5) * 55, (Math.random() - 0.5) * 35 - 10);
        m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        m.userData = { rx: (Math.random() - 0.5) * 0.006, ry: (Math.random() - 0.5) * 0.006, spd: 0.15 + Math.random() * 0.4, off: Math.random() * Math.PI * 2, by: m.position.y };
        scene.add(m); meshes.push(m);
    }

    // Orbiting rings
    for (let i = 0; i < 2; i++) {
        const rGeo = new THREE.TorusGeometry(8 + i * 5, 0.02, 8, 80);
        const rMat = new THREE.MeshBasicMaterial({ color: 0xd4a017, transparent: true, opacity: 0.04 + i * 0.015 });
        const ring = new THREE.Mesh(rGeo, rMat);
        ring.rotation.x = Math.PI / 2.2 + i * 0.4;
        ring.userData = { s: 0.08 + i * 0.04, a: i };
        scene.add(ring); meshes.push(ring); // reuse for iteration
    }

    // Particles
    const pC = 350;
    const pp = new Float32Array(pC * 3), pc = new Float32Array(pC * 3), pv = new Float32Array(pC * 3);
    for (let i = 0; i < pC; i++) {
        pp[i * 3] = (Math.random() - 0.5) * 100; pp[i * 3 + 1] = (Math.random() - 0.5) * 70; pp[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
        pv[i * 3] = (Math.random() - 0.5) * 0.008; pv[i * 3 + 1] = (Math.random() - 0.5) * 0.008; pv[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
        const c = new THREE.Color().setHSL(0.08 + Math.random() * 0.07, 0.5, 0.4 + Math.random() * 0.2);
        pc[i * 3] = c.r; pc[i * 3 + 1] = c.g; pc[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pc, 3));
    const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.5, sizeAttenuation: true }));
    scene.add(pts);

    // Lines
    const lMax = 150, lp = new Float32Array(lMax * 6);
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
    const lines = new THREE.LineSegments(lGeo, new THREE.LineBasicMaterial({ color: 0xd4a017, transparent: true, opacity: 0.03 }));
    scene.add(lines);

    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02;
        camera.position.y += (mouse.y * 2 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        meshes.forEach(m => {
            if (m.userData.rx !== undefined) {
                m.rotation.x += m.userData.rx; m.rotation.y += m.userData.ry;
                m.position.y = m.userData.by + Math.sin(t * m.userData.spd + m.userData.off) * 1.3;
            } else if (m.userData.s !== undefined) {
                m.rotation.z = t * m.userData.s;
                m.rotation.x = Math.PI / 2.2 + Math.sin(t * 0.15 + m.userData.a) * 0.25;
            }
        });

        const pos = pts.geometry.attributes.position.array;
        for (let i = 0; i < pC; i++) {
            pos[i * 3] += pv[i * 3]; pos[i * 3 + 1] += pv[i * 3 + 1]; pos[i * 3 + 2] += pv[i * 3 + 2];
            if (Math.abs(pos[i * 3]) > 50) pv[i * 3] *= -1;
            if (Math.abs(pos[i * 3 + 1]) > 35) pv[i * 3 + 1] *= -1;
            if (Math.abs(pos[i * 3 + 2]) > 25) pv[i * 3 + 2] *= -1;
        }
        pts.geometry.attributes.position.needsUpdate = true;

        let li = 0;
        const la = lines.geometry.attributes.position.array;
        for (let i = 0; i < Math.min(pC, 60) && li < lMax; i++) {
            for (let j = i + 1; j < Math.min(pC, 60) && li < lMax; j++) {
                const dx = pos[i * 3] - pos[j * 3], dy = pos[i * 3 + 1] - pos[j * 3 + 1], dz = pos[i * 3 + 2] - pos[j * 3 + 2];
                if (dx * dx + dy * dy + dz * dz < 50) {
                    la[li * 6] = pos[i * 3]; la[li * 6 + 1] = pos[i * 3 + 1]; la[li * 6 + 2] = pos[i * 3 + 2];
                    la[li * 6 + 3] = pos[j * 3]; la[li * 6 + 4] = pos[j * 3 + 1]; la[li * 6 + 5] = pos[j * 3 + 2];
                    li++;
                }
            }
        }
        lines.geometry.setDrawRange(0, li * 2);
        lines.geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }
    animate();
})();

/* ══════════════════════════════════
   3D CARD TILT + STAT TILT
══════════════════════════════════ */
function init3DCardTilt() {
    document.querySelectorAll('.file-card, .stat-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const rY = ((e.clientX - r.left) / r.width - 0.5) * 10;
            const rX = (0.5 - (e.clientY - r.top) / r.height) * 8;
            card.style.transform = `perspective(800px) rotateX(${rX}deg) rotateY(${rY}deg) scale(1.04) translateZ(10px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1) translateZ(0)';
            card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
        });
        card.addEventListener('mouseenter', () => { card.style.transition = 'none'; });
    });
}

/* ═══ Auth Guard ═══ */
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');
if (!token || !user) window.location.href = '/';

/* ═══ Bootstrap ═══ */
document.addEventListener('DOMContentLoaded', () => {
    populateUserInfo(); loadFiles(); setupDropzone(); setupOTPInputs();
    // Button ripple
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            btn.style.setProperty('--x', ((e.clientX - r.left) / r.width * 100) + '%');
            btn.style.setProperty('--y', ((e.clientY - r.top) / r.height * 100) + '%');
        });
    });
});

function populateUserInfo() {
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-avatar').textContent = user.name.charAt(0).toUpperCase();
}
function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); document.body.style.animation = 'pageReveal 0.4s var(--ease-out) reverse forwards'; setTimeout(() => window.location.href = '/', 400); }

function toast(message, type = 'info') {
    const c = document.getElementById('toast-container');
    const icons = { success: '✅', error: '❌', info: '💡' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${icons[type] || '💡'}</span><span>${message}</span>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

async function apiFetch(path, options = {}) {
    const res = await fetch(`${API}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...options.headers } });
    if (res.status === 401) { logout(); return null; }
    return res;
}

async function loadFiles() {
    document.getElementById('files-grid').innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-title">Loading your files...</div></div>`;
    try {
        const res = await apiFetch('/api/files');
        if (!res) return;
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        allFiles = data.files; updateStats(); renderFiles();
    } catch (err) {
        toast('Failed to load files: ' + err.message, 'error');
        document.getElementById('files-grid').innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><div class="empty-title">Could not load files</div><div class="empty-sub">${err.message}</div></div>`;
    }
}

function updateStats() {
    const total = allFiles.length;
    animateCounter('stat-total', total);
    animateCounter('stat-images', allFiles.filter(f => f.category === 'image').length);
    animateCounter('stat-videos', allFiles.filter(f => f.category === 'video').length);
    document.getElementById('stat-storage').textContent = formatBytes(allFiles.reduce((s, f) => s + f.size, 0));
    document.getElementById('badge-all').textContent = total;
    ['image', 'video', 'audio', 'document', 'other'].forEach(cat => {
        const el = document.getElementById('badge-' + cat);
        if (el) el.textContent = allFiles.filter(f => f.category === cat).length;
    });
    requestAnimationFrame(() => init3DCardTilt());
}

function animateCounter(id, target) {
    const el = document.getElementById(id); if (!el) return;
    const start = parseInt(el.textContent) || 0;
    if (start === target) return;
    const dur = 800, t0 = performance.now();
    function step(now) {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function renderFiles() {
    const grid = document.getElementById('files-grid');
    const f = currentCategory === 'all' ? allFiles : allFiles.filter(f => f.category === currentCategory);
    if (!f.length) {
        grid.innerHTML = `<div class="empty-state"><div class="empty-icon">${catEmoji(currentCategory)}</div><div class="empty-title">No ${currentCategory === 'all' ? '' : currentCategory + ' '}files yet</div><div class="empty-sub">Upload some files to get started!</div></div>`;
        return;
    }
    grid.innerHTML = f.map((file, i) => cardHTML(file, i)).join('');
    requestAnimationFrame(() => init3DCardTilt());
}

function cardHTML(file, i) {
    const d = new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `<div class="file-card fade-in" data-id="${file._id}" style="animation-delay:${Math.min(i * 0.07, 0.5)}s">
      <div class="file-preview">${preview(file)}<span class="file-category-badge">${file.category}</span></div>
      <div class="file-info"><div class="file-name" title="${esc(file.originalName)}">${esc(file.originalName)}</div>
      <div class="file-meta"><span>${formatBytes(file.size)}</span><span>${d}</span></div>
      <div class="file-actions">
        <button class="btn-download" onclick="requestDownload('${file._id}','${esc(file.originalName)}')">🔒 Download</button>
        <button class="btn-icon" onclick="openReplaceModal('${file._id}','${esc(file.originalName)}')">🔄</button>
        <button class="btn-icon btn-danger" onclick="deleteFile('${file._id}','${esc(file.originalName)}')">🗑️</button>
      </div></div></div>`;
}

function preview(f) {
    if (f.category === 'image') return `<img src="${f.s3Url}" alt="${esc(f.originalName)}" loading="lazy" onerror="this.parentElement.innerHTML='<span style=font-size:52px>🖼️</span>'" />`;
    return `<span style="font-size:56px;position:relative;z-index:1">${{ video: '🎥', audio: '🎵', document: '📄', other: '📦' }[f.category] || '📁'}</span>`;
}

function setCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-' + cat)?.classList.add('active');
    document.querySelectorAll('.filter-chip').forEach(el => el.classList.remove('active'));
    document.getElementById('chip-' + cat)?.classList.add('active');
    document.getElementById('header-title').textContent = { all: 'All Files', image: 'Images', video: 'Videos', audio: 'Audio Files', document: 'Documents', other: 'Other Files' }[cat] || 'Files';
    renderFiles();
}

function setupDropzone() {
    const dz = document.getElementById('dropzone');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); handleFileSelect(e.dataTransfer.files); });
}

async function handleFileSelect(files) {
    if (!files?.length) return;
    const pEl = document.getElementById('upload-progress'), lEl = document.getElementById('upload-progress-label'), fEl = document.getElementById('progress-bar-fill');
    pEl.classList.add('show');
    for (let i = 0; i < files.length; i++) {
        lEl.textContent = `Uploading ${i + 1}/${files.length}: ${files[i].name}`;
        fEl.style.width = `${(i / files.length) * 100}%`;
        const fd = new FormData(); fd.append('file', files[i]);
        try { const r = await apiFetch('/api/files/upload', { method: 'POST', body: fd }); if (!r) return; const d = await r.json(); if (!d.success) throw new Error(d.message); toast(`"${files[i].name}" uploaded!`, 'success'); }
        catch (e) { toast(`Failed: ${e.message}`, 'error') }
    }
    fEl.style.width = '100%'; lEl.textContent = 'Upload complete!';
    setTimeout(() => { pEl.classList.remove('show'); fEl.style.width = '0%' }, 1500);
    document.getElementById('upload-input').value = ''; await loadFiles();
}

async function deleteFile(id, name) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
        const r = await apiFetch(`/api/files/${id}`, { method: 'DELETE' }); if (!r) return;
        const d = await r.json(); if (!d.success) throw new Error(d.message);
        const card = document.querySelector(`.file-card[data-id="${id}"]`);
        if (card) { card.style.transition = '0.6s cubic-bezier(0.16,1,0.3,1)'; card.style.transform = 'perspective(800px) rotateY(20deg) rotateX(-10deg) scale(0.7) translateZ(-50px)'; card.style.opacity = '0'; await new Promise(r => setTimeout(r, 600)); }
        toast(`"${name}" deleted.`, 'success'); await loadFiles();
    } catch (e) { toast('Delete failed: ' + e.message, 'error') }
}

function openReplaceModal(id, name) { currentReplaceFileId = id; document.getElementById('replace-filename').textContent = name; document.getElementById('replace-modal').classList.add('show') }
function closeReplaceModal() { document.getElementById('replace-modal').classList.remove('show'); currentReplaceFileId = null; document.getElementById('replace-input').value = '' }
async function doReplace(file) { if (!file || !currentReplaceFileId) return; closeReplaceModal(); const fd = new FormData(); fd.append('file', file); try { const r = await apiFetch(`/api/files/${currentReplaceFileId}`, { method: 'PUT', body: fd }); if (!r) return; const d = await r.json(); if (!d.success) throw new Error(d.message); toast('File replaced!', 'success'); await loadFiles() } catch (e) { toast('Replace failed: ' + e.message, 'error') } }

async function requestDownload(id, name) { currentDownloadFileId = id; currentDownloadFileName = name; toast('Sending OTP...', 'info'); try { const r = await apiFetch(`/api/files/${id}/request-download`, { method: 'POST' }); if (!r) return; const d = await r.json(); if (!d.success) throw new Error(d.message); openOTPModal(name); toast('OTP sent!', 'success') } catch (e) { toast('Failed: ' + e.message, 'error') } }

function openOTPModal(name) { document.getElementById('otp-filename').textContent = name; document.getElementById('otp-modal').classList.add('show'); document.getElementById('otp-error').classList.remove('show'); clearOTPInputs(); otpExpiresAt = Date.now() + 5 * 60 * 1000; startOTPTimer(); setTimeout(() => document.getElementById('otp-d0').focus(), 250) }
function closeOTPModal() { document.getElementById('otp-modal').classList.remove('show'); clearOTPTimer(); clearOTPInputs(); currentDownloadFileId = null }
function clearOTPInputs() { for (let i = 0; i < 6; i++) { const e = document.getElementById('otp-d' + i); if (e) e.value = '' } }

function setupOTPInputs() {
    for (let i = 0; i < 6; i++) {
        const el = document.getElementById('otp-d' + i); if (!el) continue;
        el.addEventListener('input', e => { const v = e.target.value.replace(/\D/g, ''); e.target.value = v; if (v && i < 5) document.getElementById('otp-d' + (i + 1)).focus(); if (getOTP().length === 6) setTimeout(() => verifyOTP(), 100) });
        el.addEventListener('keydown', e => { if (e.key === 'Backspace' && !e.target.value && i > 0) document.getElementById('otp-d' + (i - 1)).focus() });
        el.addEventListener('paste', e => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6); for (let j = 0; j < t.length; j++) { const d = document.getElementById('otp-d' + j); if (d) d.value = t[j] } if (t.length === 6) setTimeout(() => verifyOTP(), 100) });
    }
}
function getOTP() { let v = ''; for (let i = 0; i < 6; i++)v += (document.getElementById('otp-d' + i)?.value || ''); return v }

async function verifyOTP() {
    const otp = getOTP(); if (otp.length !== 6) { document.getElementById('otp-error').classList.add('show'); document.getElementById('otp-error-msg').textContent = 'Enter all 6 digits.'; return }
    document.getElementById('otp-error').classList.remove('show'); const btn = document.getElementById('otp-verify-btn'), bt = document.getElementById('otp-btn-text'); btn.disabled = true; bt.innerHTML = '<span class="spinner"></span> Verifying...';
    try {
        const r = await apiFetch(`/api/files/${currentDownloadFileId}/verify-download`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ otp }) }); if (!r) { btn.disabled = false; bt.textContent = 'Verify & Download'; return }
        const d = await r.json(); if (!d.success) throw new Error(d.message); const a = document.createElement('a'); a.href = d.downloadUrl; a.download = d.fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); toast(`"${d.fileName}" downloading!`, 'success'); closeOTPModal()
    }
    catch (e) { document.getElementById('otp-error').classList.add('show'); document.getElementById('otp-error-msg').textContent = e.message }
    finally { btn.disabled = false; bt.textContent = 'Verify & Download' }
}

async function resendOTP() { if (!currentDownloadFileId) return; clearOTPTimer(); clearOTPInputs(); document.getElementById('otp-error').classList.remove('show'); toast('Resending OTP...', 'info'); try { const r = await apiFetch(`/api/files/${currentDownloadFileId}/request-download`, { method: 'POST' }); if (!r) return; const d = await r.json(); if (!d.success) throw new Error(d.message); otpExpiresAt = Date.now() + 5 * 60 * 1000; startOTPTimer(); toast('New OTP sent!', 'success'); document.getElementById('otp-d0').focus() } catch (e) { toast('Failed: ' + e.message, 'error') } }

function startOTPTimer() { clearOTPTimer(); const ce = document.getElementById('otp-countdown'), te = document.getElementById('otp-timer'); otpTimerInterval = setInterval(() => { const rem = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000)); ce.textContent = `${Math.floor(rem / 60)}:${(rem % 60).toString().padStart(2, '0')}`; if (rem <= 60) te.classList.add('danger'); else te.classList.remove('danger'); if (rem === 0) { clearOTPTimer(); document.getElementById('otp-error').classList.add('show'); document.getElementById('otp-error-msg').textContent = 'OTP expired. Click Resend.' } }, 1000) }
function clearOTPTimer() { if (otpTimerInterval) clearInterval(otpTimerInterval); otpTimerInterval = null; document.getElementById('otp-countdown').textContent = '5:00'; document.getElementById('otp-timer').classList.remove('danger') }

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open') }
function formatBytes(b) { if (!b) return '0 B'; const k = 1024, u = ['B', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(b) / Math.log(k)); return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + u[i] }
function catEmoji(c) { return { all: '🗂️', image: '🖼️', video: '🎥', audio: '🎵', document: '📄', other: '📦' }[c] || '📁' }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;') }

document.getElementById('otp-modal').addEventListener('click', e => { if (e.target === document.getElementById('otp-modal')) closeOTPModal() });
document.getElementById('replace-modal').addEventListener('click', e => { if (e.target === document.getElementById('replace-modal')) closeReplaceModal() });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (document.getElementById('otp-modal').classList.contains('show')) closeOTPModal(); if (document.getElementById('replace-modal').classList.contains('show')) closeReplaceModal() } });
