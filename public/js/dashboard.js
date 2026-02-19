/* ═══════════════════════════════════════════════════════
   SECURESTORE DASHBOARD — JavaScript
═══════════════════════════════════════════════════════ */

const API = '';
let allFiles = [];
let currentCategory = 'all';
let currentDownloadFileId = null;
let currentDownloadFileName = null;
let currentReplaceFileId = null;
let otpTimerInterval = null;
let otpExpiresAt = null;

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
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
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

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-images').textContent = images;
    document.getElementById('stat-videos').textContent = videos;
    document.getElementById('stat-storage').textContent = formatBytes(totalBytes);

    // Nav badges
    const categories = ['image', 'video', 'audio', 'document', 'other'];
    document.getElementById('badge-all').textContent = total;
    categories.forEach((cat) => {
        const el = document.getElementById('badge-' + cat);
        if (el) el.textContent = allFiles.filter((f) => f.category === cat).length;
    });
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

    grid.innerHTML = filtered.map((file) => fileCardHTML(file)).join('');
}

function fileCardHTML(file) {
    const emoji = getCategoryEmoji(file.category);
    const preview = previewHTML(file);
    const date = new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `
    <div class="file-card fade-in" data-id="${file._id}">
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
    return `<span style="font-size:56px;">${emojis[file.category] || '📁'}</span>`;
}

/* ── Category Navigation ────────────────────────────── */
function setCategory(cat) {
    currentCategory = cat;

    // Nav items
    document.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('active'));
    const navEl = document.getElementById('nav-' + cat);
    if (navEl) navEl.classList.add('active');

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach((el) => el.classList.remove('active'));
    const chipEl = document.getElementById('chip-' + cat);
    if (chipEl) chipEl.classList.add('active');

    // Header
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
            toast(`✅ "${file.name}" uploaded!`, 'success');
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

    // Reset file input
    document.getElementById('upload-input').value = '';
    await loadFiles();
}

/* ── Delete File ────────────────────────────────────── */
async function deleteFile(fileId, fileName) {
    if (!confirm(`Delete "${fileName}"?\n\nThis will permanently remove it from S3 and cannot be undone.`)) return;

    try {
        const res = await apiFetch(`/api/files/${fileId}`, { method: 'DELETE' });
        if (!res) return;
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        toast(`"${fileName}" deleted successfully.`, 'success');
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
        toast('File replaced successfully!', 'success');
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

    // Start countdown (5 mins)
    otpExpiresAt = Date.now() + 5 * 60 * 1000;
    startOTPTimer();

    setTimeout(() => document.getElementById('otp-d0').focus(), 100);
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

        // Trigger file download via presigned URL
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
        toast('New OTP sent to your email!', 'success');
        document.getElementById('otp-d0').focus();
    } catch (err) {
        toast('Failed to resend OTP: ' + err.message, 'error');
    }
}

/* ── OTP Timer ──────────────────────────────────────── */
function startOTPTimer() {
    clearOTPTimer();
    const timerEl = document.getElementById('otp-timer');
    const countdownEl = document.getElementById('otp-countdown');

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

/* ── Sidebar Mobile Toggle ──────────────────────────── */
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
