const API = '';

/* ── Tab switching ────────────────────────────── */
function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach((f) => f.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('form-' + tab).classList.add('active');
}

/* ── Show / hide errors ───────────────────────── */
function showError(id, msgId, msg) {
    document.getElementById(id).classList.add('show');
    document.getElementById(msgId).textContent = msg;
}
function hideError(id) {
    document.getElementById(id).classList.remove('show');
}
function showSuccess(id, msgId, msg) {
    document.getElementById(id).classList.add('show');
    document.getElementById(msgId).textContent = msg;
}

/* ── Login ────────────────────────────────────── */
async function handleLogin(e) {
    e.preventDefault();
    hideError('login-error');

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const btnText = document.getElementById('login-btn-text');

    btn.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span> Signing in...';

    try {
        const res = await fetch(`${API}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Login failed');

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard.html';
    } catch (err) {
        showError('login-error', 'login-error-msg', err.message);
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Sign In';
    }
}

/* ── Register ─────────────────────────────────── */
async function handleRegister(e) {
    e.preventDefault();
    hideError('register-error');
    document.getElementById('register-success').classList.remove('show');

    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const btn = document.getElementById('register-btn');
    const btnText = document.getElementById('register-btn-text');

    if (password.length < 6) {
        showError('register-error', 'register-error-msg', 'Password must be at least 6 characters.');
        return;
    }

    btn.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span> Creating account...';

    try {
        const res = await fetch(`${API}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Registration failed');

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard.html';
    } catch (err) {
        showError('register-error', 'register-error-msg', err.message);
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Create Account';
    }
}

/* ── Guard: redirect if already logged in ─────── */
if (localStorage.getItem('token')) {
    window.location.href = '/dashboard.html';
}
