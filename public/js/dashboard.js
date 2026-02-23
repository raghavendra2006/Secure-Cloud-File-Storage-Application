/* ═══════════════════════════════════════════════════════
   SECURESTORE DASHBOARD — Gold Luxury Edition
═══════════════════════════════════════════════════════ */

const API = '';
let allFiles = [];
let currentCategory = 'all';
let currentDownloadFileId = null;
let currentDownloadFileName = null;
let currentReplaceFileId = null;
let otpTimerInterval = null;
let otpExpiresAt = null;

/* ══════════════════════════════════
   THREE.JS 3D BACKGROUND — GOLD
══════════════════════════════════ */
(function init3DBackground() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 35;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    let mouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ─── Gold Wireframe Objects ──────────────────
    const geometries = [];
    const shapeFactories = [
        () => new THREE.IcosahedronGeometry(0.9, 0),
        () => new THREE.OctahedronGeometry(0.8, 0),
        () => new THREE.TetrahedronGeometry(0.7, 0),
        () => new THREE.TorusGeometry(0.6, 0.2, 6, 12),
        () => new THREE.BoxGeometry(0.8, 0.8, 0.8),
    ];

    for (let i = 0; i < 12; i++) {
        const geo = shapeFactories[Math.floor(Math.random() * shapeFactories.length)]();
        const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.08 + Math.random() * 0.06, 0.65, 0.25 + Math.random() * 0.1),
            wireframe: true,
            transparent: true,
            opacity: 0.07 + Math.random() * 0.06,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 70,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 30 - 10
        );
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        mesh.userData = {
            rotSpeed: { x: (Math.random() - 0.5) * 0.005, y: (Math.random() - 0.5) * 0.005 },
            floatSpeed: 0.2 + Math.random() * 0.4,
            floatOffset: Math.random() * Math.PI * 2,
            baseY: mesh.position.y,
        };
        scene.add(mesh);
        geometries.push(mesh);
    }

    // ─── Gold Particle Field ────────────────────
    const particleCount = 350;
    const positions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 70;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
        const c = new THREE.Color().setHSL(0.08 + Math.random() * 0.07, 0.5, 0.4 + Math.random() * 0.2);
        pColors[i * 3] = c.r;
        pColors[i * 3 + 1] = c.g;
        pColors[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    const pMat = new THREE.PointsMaterial({
        size: 0.06,
        vertexColors: true,
        transparent: true,
        opacity: 0.45,
        sizeAttenuation: true,
    });
    const pts = new THREE.Points(pGeo, pMat);
    scene.add(pts);

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        camera.position.x += (mouse.x * 2 - camera.position.x) * 0.015;
        camera.position.y += (mouse.y * 1.5 - camera.position.y) * 0.015;
        camera.lookAt(0, 0, 0);

        geometries.forEach((mesh) => {
            mesh.rotation.x += mesh.userData.rotSpeed.x;
            mesh.rotation.y += mesh.userData.rotSpeed.y;
            mesh.position.y = mesh.userData.baseY + Math.sin(t * mesh.userData.floatSpeed + mesh.userData.floatOffset) * 1.2;
        });

        pts.rotation.y = t * 0.012;

        renderer.render(scene, camera);
    }
    animate();
})();

/* ══════════════════════════════════
   3D CARD TILT EFFECT
══════════════════════════════════ */
function init3DCardTilt() {
    document.querySelectorAll('.file-card').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateY = ((x - centerX) / centerX) * 8;
            const rotateX = ((centerY - y) / centerY) * 6;
            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });
}

/* ── Auth Guard ─────────────────────────────────────── */
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user) window.location.href = '/';

/* ── Bootstrap ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    populateUserInfo();
    loadFiles();
    setupDropzone();
    setupOTPInputs();
});

/* ── User Info ──────────────────────────────────────── */
function populateUserInfo() {
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-avatar').textContent = user.name.charAt(0).toUpperCase();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

/* ── Toast Notifications ────────────────────────────── */
function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: '✅', error: '❌', info: '💡' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${icons[type] || '💡'}</span><span>${message}</span>`;
    container.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

/* ── API Helper ─────────────────────────────────────── */
async function apiFetch(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
    if (res.status === 401) {
        logout();
        return null;
    }
    return res;
}

/* ── Load Files ─────────────────────────────────────── */
async function loadFiles() {
    document.getElementById('files-grid').innerHTML = `
    <div class="empty-state" id="loading-state">
      <div class="empty-icon">⏳</div>
      <div class="empty-title">Loading your files...</div>
    </div>`;

    try {
        const res = await apiFetch('/api/files');
        if (!res) return;
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        allFiles = data.files;
        updateStats();
        renderFiles();
    } catch (err) {
        toast('Failed to load files: ' + err.message, 'error');
        document.getElementById('files-grid').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <div class="empty-title">Could not load files</div>
        <div class="empty-sub">${err.message}</div>
      </div>`;
    }
}

/* ── Stats ──────────────────────────────────────────── */
function updateStats() {
    const total = allFiles.length;
    const images = allFiles.filter((f) => f.category === 'image').length;
    const videos = allFiles.filter((f) => f.category === 'video').length;
    const totalBytes = allFiles.reduce((s, f) => s + f.size, 0);

    animateCounter('stat-total', total);
    animateCounter('stat-images', images);
    animateCounter('stat-videos', videos);
    document.getElementById('stat-storage').textContent = formatBytes(totalBytes);

    const categories = ['image', 'video', 'audio', 'document', 'other'];
    document.getElementById('badge-all').textContent = total;
    categories.forEach((cat) => {
        const el = document.getElementById('badge-' + cat);
        if (el) el.textContent = allFiles.filter((f) => f.category === cat).length;
    });
}

/* ── Counter Animation ─────────────────────────────── */
function animateCounter(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    if (start === target) return;
    const duration = 700;
    const startTime = performance.now();

    function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

/* ── Render Files ───────────────────────────────────── */
function renderFiles() {
    const grid = document.getElementById('files-grid');
    const filtered = currentCategory === 'all'
        ? allFiles
        : allFiles.filter((f) => f.category === currentCategory);

    if (filtered.length === 0) {
        grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${getCategoryEmoji(currentCategory)}</div>
        <div class="empty-title">No ${currentCategory === 'all' ? '' : currentCategory + ' '}files yet</div>
        <div class="empty-sub">Upload some files to get started!</div>
      </div>`;
        return;
    }

    grid.innerHTML = filtered.map((file, i) => fileCardHTML(file, i)).join('');
    requestAnimationFrame(() => init3DCardTilt());
}

function fileCardHTML(file, index) {
    const preview = previewHTML(file);
    const date = new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const delay = Math.min(index * 0.06, 0.5);

    return `
    <div class="file-card fade-in" data-id="${file._id}" style="animation-delay: ${delay}s">
      <div class="file-preview">
        ${preview}
        <span class="file-category-badge">${file.category}</span>
      </div>
      <div class="file-info">
        <div class="file-name" title="${escapeHtml(file.originalName)}">${escapeHtml(file.originalName)}</div>
        <div class="file-meta">
          <span>${formatBytes(file.size)}</span>
          <span>${date}</span>
        </div>
        <div class="file-actions">
          <button class="btn-download" onclick="requestDownload('${file._id}', '${escapeHtml(file.originalName)}')" title="Secure Download">
            🔒 Download
          </button>
          <button class="btn-icon" onclick="openReplaceModal('${file._id}', '${escapeHtml(file.originalName)}')" title="Replace file">🔄</button>
          <button class="btn-icon btn-danger" onclick="deleteFile('${file._id}', '${escapeHtml(file.originalName)}')" title="Delete file">🗑️</button>
        </div>
      </div>
    </div>`;
}

function previewHTML(file) {
    if (file.category === 'image') {
        return `<img src="${file.s3Url}" alt="${escapeHtml(file.originalName)}" loading="lazy" onerror="this.parentElement.innerHTML='<span style=font-size:52px>🖼️</span>'" />`;
    }
    const emojis = { video: '🎥', audio: '🎵', document: '📄', other: '📦' };
    return `<span style="font-size:56px; position:relative; z-index:1;">${emojis[file.category] || '📁'}</span>`;
}

/* ── Category Navigation ────────────────────────────── */
function setCategory(cat) {
    currentCategory = cat;

    document.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('active'));
    const navEl = document.getElementById('nav-' + cat);
    if (navEl) navEl.classList.add('active');

    document.querySelectorAll('.filter-chip').forEach((el) => el.classList.remove('active'));
    const chipEl = document.getElementById('chip-' + cat);
    if (chipEl) chipEl.classList.add('active');

    const titles = {
        all: 'All Files', image: 'Images', video: 'Videos',
        audio: 'Audio Files', document: 'Documents', other: 'Other Files'
    };
    document.getElementById('header-title').textContent = titles[cat] || 'Files';
    document.getElementById('header-subtitle').textContent = 'Manage your cloud storage';

    renderFiles();
}

/* ── Upload ─────────────────────────────────────────── */
function setupDropzone() {
    const dropzone = document.getElementById('dropzone');
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        handleFileSelect(e.dataTransfer.files);
    });
}

async function handleFileSelect(files) {
    if (!files || files.length === 0) return;

    const progressEl = document.getElementById('upload-progress');
    const labelEl = document.getElementById('upload-progress-label');
    const fillEl = document.getElementById('progress-bar-fill');

    progressEl.classList.add('show');

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        labelEl.textContent = `Uploading ${i + 1}/${files.length}: ${file.name}`;
        fillEl.style.width = `${((i) / files.length) * 100}%`;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await apiFetch('/api/files/upload', { method: 'POST', body: formData });
            if (!res) return;
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            toast(`"${file.name}" uploaded!`, 'success');
        } catch (err) {
            toast(`Failed to upload "${file.name}": ${err.message}`, 'error');
        }
    }

    fillEl.style.width = '100%';
    labelEl.textContent = 'Upload complete!';
    setTimeout(() => {
        progressEl.classList.remove('show');
        fillEl.style.width = '0%';
    }, 1500);

    document.getElementById('upload-input').value = '';
    await loadFiles();
}

/* ── Delete File ────────────────────────────────────── */
async function deleteFile(fileId, fileName) {
    if (!confirm(`Delete "${fileName}"?\n\nThis will permanently remove it from S3.`)) return;

    try {
        const res = await apiFetch(`/api/files/${fileId}`, { method: 'DELETE' });
        if (!res) return;
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const card = document.querySelector(`.file-card[data-id="${fileId}"]`);
        if (card) {
            card.style.transition = '0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            card.style.transform = 'perspective(800px) rotateY(15deg) scale(0.8)';
            card.style.opacity = '0';
            await new Promise(r => setTimeout(r, 500));
        }

        toast(`"${fileName}" deleted.`, 'success');
        await loadFiles();
    } catch (err) {
        toast('Delete failed: ' + err.message, 'error');
    }
}

/* ── Replace File Modal ─────────────────────────────── */
function openReplaceModal(fileId, fileName) {
    currentReplaceFileId = fileId;
    document.getElementById('replace-filename').textContent = fileName;
    document.getElementById('replace-modal').classList.add('show');
}

function closeReplaceModal() {
    document.getElementById('replace-modal').classList.remove('show');
    currentReplaceFileId = null;
    document.getElementById('replace-input').value = '';
}

async function doReplace(file) {
    if (!file || !currentReplaceFileId) return;
    closeReplaceModal();

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await apiFetch(`/api/files/${currentReplaceFileId}`, { method: 'PUT', body: formData });
        if (!res) return;
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        toast('File replaced!', 'success');
        await loadFiles();
    } catch (err) {
        toast('Replace failed: ' + err.message, 'error');
    }
}

/* ── OTP Download Flow ──────────────────────────────── */
async function requestDownload(fileId, fileName) {
    currentDownloadFileId = fileId;
    currentDownloadFileName = fileName;

    toast('Sending OTP to your email...', 'info');

    try {
        const res = await apiFetch(`/api/files/${fileId}/request-download`, { method: 'POST' });
        if (!res) return;
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        openOTPModal(fileName);
        toast('OTP sent! Check your email.', 'success');
    } catch (err) {
        toast('Failed to send OTP: ' + err.message, 'error');
    }
}

function openOTPModal(fileName) {
    document.getElementById('otp-filename').textContent = fileName;
    document.getElementById('otp-modal').classList.add('show');
    document.getElementById('otp-error').classList.remove('show');
    clearOTPInputs();

    otpExpiresAt = Date.now() + 5 * 60 * 1000;
    startOTPTimer();
    setTimeout(() => document.getElementById('otp-d0').focus(), 250);
}

function closeOTPModal() {
    document.getElementById('otp-modal').classList.remove('show');
    clearOTPTimer();
    clearOTPInputs();
    currentDownloadFileId = null;
    currentDownloadFileName = null;
}

function clearOTPInputs() {
    for (let i = 0; i < 6; i++) {
        const el = document.getElementById('otp-d' + i);
        if (el) el.value = '';
    }
}

function setupOTPInputs() {
    for (let i = 0; i < 6; i++) {
        const el = document.getElementById('otp-d' + i);
        if (!el) continue;

        el.addEventListener('input', (e) => {
            const val = e.target.value.replace(/\D/g, '');
            e.target.value = val;
            if (val && i < 5) document.getElementById('otp-d' + (i + 1)).focus();
            if (getOTPValue().length === 6) setTimeout(() => verifyOTP(), 100);
        });

        el.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && i > 0) {
                document.getElementById('otp-d' + (i - 1)).focus();
            }
        });

        el.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
            for (let j = 0; j < text.length; j++) {
                const digit = document.getElementById('otp-d' + j);
                if (digit) digit.value = text[j];
            }
            if (text.length === 6) setTimeout(() => verifyOTP(), 100);
        });
    }
}

function getOTPValue() {
    let val = '';
    for (let i = 0; i < 6; i++) {
        val += (document.getElementById('otp-d' + i)?.value || '');
    }
    return val;
}

async function verifyOTP() {
    const otp = getOTPValue();
    if (otp.length !== 6) {
        document.getElementById('otp-error').classList.add('show');
        document.getElementById('otp-error-msg').textContent = 'Please enter all 6 digits.';
        return;
    }

    document.getElementById('otp-error').classList.remove('show');
    const btn = document.getElementById('otp-verify-btn');
    const btnText = document.getElementById('otp-btn-text');
    btn.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span> Verifying...';

    try {
        const res = await apiFetch(`/api/files/${currentDownloadFileId}/verify-download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp }),
        });
        if (!res) { btn.disabled = false; btnText.textContent = 'Verify & Download'; return; }

        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = data.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast(`"${data.fileName}" download started!`, 'success');
        closeOTPModal();
    } catch (err) {
        document.getElementById('otp-error').classList.add('show');
        document.getElementById('otp-error-msg').textContent = err.message;
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Verify & Download';
    }
}

async function resendOTP() {
    if (!currentDownloadFileId) return;
    clearOTPTimer();
    clearOTPInputs();
    document.getElementById('otp-error').classList.remove('show');

    toast('Resending OTP...', 'info');
    try {
        const res = await apiFetch(`/api/files/${currentDownloadFileId}/request-download`, { method: 'POST' });
        if (!res) return;
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        otpExpiresAt = Date.now() + 5 * 60 * 1000;
        startOTPTimer();
        toast('New OTP sent!', 'success');
        document.getElementById('otp-d0').focus();
    } catch (err) {
        toast('Failed to resend: ' + err.message, 'error');
    }
}

/* ── OTP Timer ──────────────────────────────────────── */
function startOTPTimer() {
    clearOTPTimer();
    const countdownEl = document.getElementById('otp-countdown');
    const timerEl = document.getElementById('otp-timer');

    otpTimerInterval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000));
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        countdownEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (remaining <= 60) timerEl.classList.add('danger');
        else timerEl.classList.remove('danger');

        if (remaining === 0) {
            clearOTPTimer();
            document.getElementById('otp-error').classList.add('show');
            document.getElementById('otp-error-msg').textContent = 'OTP has expired. Click Resend.';
        }
    }, 1000);
}

function clearOTPTimer() {
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    otpTimerInterval = null;
    document.getElementById('otp-countdown').textContent = '5:00';
    document.getElementById('otp-timer').classList.remove('danger');
}

/* ── Sidebar Toggle ─────────────────────────────────── */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

/* ── Utilities ──────────────────────────────────────── */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
}

function getCategoryEmoji(cat) {
    const map = { all: '🗂️', image: '🖼️', video: '🎥', audio: '🎵', document: '📄', other: '📦' };
    return map[cat] || '📁';
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Close modals on overlay click
document.getElementById('otp-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('otp-modal')) closeOTPModal();
});
document.getElementById('replace-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('replace-modal')) closeReplaceModal();
});

// Close modals on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (document.getElementById('otp-modal').classList.contains('show')) closeOTPModal();
        if (document.getElementById('replace-modal').classList.contains('show')) closeReplaceModal();
    }
});
