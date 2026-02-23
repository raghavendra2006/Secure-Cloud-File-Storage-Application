/* ═══════════════════════════════════════════════════════
   SECURESTORE AUTH — Gold Luxury Edition
═══════════════════════════════════════════════════════ */

const API = '';

/* ══════════════════════════════════
   THREE.JS 3D BACKGROUND — GOLD
══════════════════════════════════ */
(function init3DBackground() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

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

    // ─── Gold Wireframe Geometry ────────────────
    const geometries = [];
    const shapes = [
        new THREE.IcosahedronGeometry(1.2, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TetrahedronGeometry(1, 0),
        new THREE.TorusGeometry(0.8, 0.3, 8, 16),
        new THREE.DodecahedronGeometry(0.9, 0),
    ];

    // Gold/amber/copper color range: hue 0.08–0.14
    for (let i = 0; i < 18; i++) {
        const geo = shapes[Math.floor(Math.random() * shapes.length)];
        const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.08 + Math.random() * 0.06, 0.7, 0.3 + Math.random() * 0.1),
            wireframe: true,
            transparent: true,
            opacity: 0.1 + Math.random() * 0.08,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40
        );
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        mesh.userData = {
            rotSpeed: { x: (Math.random() - 0.5) * 0.007, y: (Math.random() - 0.5) * 0.007, z: (Math.random() - 0.5) * 0.003 },
            floatSpeed: 0.3 + Math.random() * 0.6,
            floatOffset: Math.random() * Math.PI * 2,
            baseY: mesh.position.y,
        };
        scene.add(mesh);
        geometries.push(mesh);
    }

    // ─── Gold Particle Cloud ────────────────────
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
        // Gold/warm colors
        const c = new THREE.Color().setHSL(0.08 + Math.random() * 0.08, 0.6, 0.45 + Math.random() * 0.2);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particleMat = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ─── Warm Glow Sphere ───────────────────────
    const glowGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xd4a017, // gold
        transparent: true,
        opacity: 0.03,
    });
    const glowSphere = new THREE.Mesh(glowGeo, glowMat);
    glowSphere.position.set(-8, 0, -5);
    scene.add(glowSphere);

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02;
        camera.position.y += (mouse.y * 2 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        geometries.forEach((mesh) => {
            mesh.rotation.x += mesh.userData.rotSpeed.x;
            mesh.rotation.y += mesh.userData.rotSpeed.y;
            mesh.rotation.z += mesh.userData.rotSpeed.z;
            mesh.position.y = mesh.userData.baseY + Math.sin(elapsed * mesh.userData.floatSpeed + mesh.userData.floatOffset) * 1.5;
        });

        particles.rotation.y = elapsed * 0.018;
        particles.rotation.x = Math.sin(elapsed * 0.009) * 0.08;

        glowSphere.scale.setScalar(1 + Math.sin(elapsed * 0.7) * 0.12);
        glowSphere.material.opacity = 0.025 + Math.sin(elapsed * 0.4) * 0.012;

        renderer.render(scene, camera);
    }
    animate();
})();

/* ── Tab switching ────────────────────────────────── */
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
