/* ═══════════════════════════════════════════════════════
   SECURESTORE AUTH — Fully Animated 3D Gold Edition
═══════════════════════════════════════════════════════ */
const API = '';

/* ══════════════════════════════════
   THREE.JS ADVANCED 3D SCENE
══════════════════════════════════ */
(function init3D() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
    camera.position.z = 32;

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

    /* ─── Wireframe Shapes ─── */
    const meshes = [];
    const shapes = [
        () => new THREE.IcosahedronGeometry(1.1, 0),
        () => new THREE.OctahedronGeometry(0.9, 0),
        () => new THREE.TetrahedronGeometry(0.9, 0),
        () => new THREE.TorusGeometry(0.7, 0.25, 8, 16),
        () => new THREE.DodecahedronGeometry(0.8, 0),
        () => new THREE.TorusKnotGeometry(0.6, 0.2, 48, 8, 2, 3),
    ];
    for (let i = 0; i < 20; i++) {
        const geo = shapes[i % shapes.length]();
        const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.08 + Math.random() * 0.06, 0.7, 0.25 + Math.random() * 0.12),
            wireframe: true, transparent: true,
            opacity: 0.06 + Math.random() * 0.08,
        });
        const m = new THREE.Mesh(geo, mat);
        m.position.set((Math.random() - 0.5) * 65, (Math.random() - 0.5) * 45, (Math.random() - 0.5) * 40);
        m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        m.userData = {
            rx: (Math.random() - 0.5) * 0.008, ry: (Math.random() - 0.5) * 0.008,
            spd: 0.2 + Math.random() * 0.6, off: Math.random() * Math.PI * 2,
            by: m.position.y,
        };
        scene.add(m);
        meshes.push(m);
    }

    /* ─── Orbiting Rings ─── */
    const rings = [];
    for (let i = 0; i < 3; i++) {
        const rGeo = new THREE.TorusGeometry(6 + i * 4, 0.03, 8, 80);
        const rMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.1, 0.6, 0.35), wireframe: false,
            transparent: true, opacity: 0.06 + i * 0.02,
        });
        const ring = new THREE.Mesh(rGeo, rMat);
        ring.rotation.x = Math.PI / 2 + i * 0.3;
        ring.rotation.y = i * 0.5;
        ring.userData = { speed: 0.1 + i * 0.05, axis: i };
        scene.add(ring);
        rings.push(ring);
    }

    /* ─── Particle Cloud with Connection Lines ─── */
    const pCount = 500;
    const pPos = new Float32Array(pCount * 3);
    const pCol = new Float32Array(pCount * 3);
    const pVel = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 80;
        pPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
        pVel[i * 3] = (Math.random() - 0.5) * 0.01;
        pVel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
        pVel[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
        const c = new THREE.Color().setHSL(0.08 + Math.random() * 0.07, 0.6, 0.4 + Math.random() * 0.25);
        pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({
        size: 0.1, vertexColors: true, transparent: true, opacity: 0.6, sizeAttenuation: true,
    }));
    scene.add(pts);

    /* ─── Connection Lines ─── */
    const lineMax = 200;
    const linePos = new Float32Array(lineMax * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0xd4a017, transparent: true, opacity: 0.04 });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    /* ─── Mouse Glow ─── */
    const glowGeo = new THREE.SphereGeometry(2, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.04 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        camera.position.x += (mouse.x * 4 - camera.position.x) * 0.025;
        camera.position.y += (mouse.y * 3 - camera.position.y) * 0.025;
        camera.lookAt(0, 0, 0);

        // Shapes
        meshes.forEach(m => {
            m.rotation.x += m.userData.rx;
            m.rotation.y += m.userData.ry;
            m.position.y = m.userData.by + Math.sin(t * m.userData.spd + m.userData.off) * 1.8;
        });

        // Rings orbit
        rings.forEach(r => {
            r.rotation.z = t * r.userData.speed;
            r.rotation.x = Math.PI / 2.5 + Math.sin(t * 0.2 + r.userData.axis) * 0.3;
        });

        // Move particles
        const pos = pts.geometry.attributes.position.array;
        for (let i = 0; i < pCount; i++) {
            pos[i * 3] += pVel[i * 3];
            pos[i * 3 + 1] += pVel[i * 3 + 1];
            pos[i * 3 + 2] += pVel[i * 3 + 2];
            if (Math.abs(pos[i * 3]) > 40) pVel[i * 3] *= -1;
            if (Math.abs(pos[i * 3 + 1]) > 30) pVel[i * 3 + 1] *= -1;
            if (Math.abs(pos[i * 3 + 2]) > 25) pVel[i * 3 + 2] *= -1;
        }
        pts.geometry.attributes.position.needsUpdate = true;

        // Connection lines (nearby particles)
        let li = 0;
        const lp = lines.geometry.attributes.position.array;
        for (let i = 0; i < Math.min(pCount, 80) && li < lineMax; i++) {
            for (let j = i + 1; j < Math.min(pCount, 80) && li < lineMax; j++) {
                const dx = pos[i * 3] - pos[j * 3], dy = pos[i * 3 + 1] - pos[j * 3 + 1], dz = pos[i * 3 + 2] - pos[j * 3 + 2];
                const d = dx * dx + dy * dy + dz * dz;
                if (d < 64) {
                    lp[li * 6] = pos[i * 3]; lp[li * 6 + 1] = pos[i * 3 + 1]; lp[li * 6 + 2] = pos[i * 3 + 2];
                    lp[li * 6 + 3] = pos[j * 3]; lp[li * 6 + 4] = pos[j * 3 + 1]; lp[li * 6 + 5] = pos[j * 3 + 2];
                    li++;
                }
            }
        }
        lines.geometry.setDrawRange(0, li * 2);
        lines.geometry.attributes.position.needsUpdate = true;

        // Mouse glow
        glow.position.set(mouse.x * 15, mouse.y * 10, 5);
        glow.scale.setScalar(1 + Math.sin(t * 1.5) * 0.3);
        glow.material.opacity = 0.03 + Math.sin(t * 0.8) * 0.015;

        renderer.render(scene, camera);
    }
    animate();
})();

/* ═══ 3D TILT ON AUTH ELEMENTS ═══ */
document.addEventListener('DOMContentLoaded', () => {
    const panel = document.querySelector('.auth-box');
    if (!panel) return;
    panel.addEventListener('mousemove', e => {
        const r = panel.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * 4;
        const y = ((e.clientY - r.top) / r.height - 0.5) * -3;
        panel.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${y}deg)`;
    });
    panel.addEventListener('mouseleave', () => {
        panel.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        panel.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
    });
    panel.addEventListener('mouseenter', () => { panel.style.transition = 'none'; });

    // Button ripple
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            btn.style.setProperty('--x', ((e.clientX - r.left) / r.width * 100) + '%');
            btn.style.setProperty('--y', ((e.clientY - r.top) / r.height * 100) + '%');
        });
    });
});

/* ═══ Tab switching ═══ */
function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('form-' + tab).classList.add('active');
}

function showError(id, msgId, msg) { document.getElementById(id).classList.add('show'); document.getElementById(msgId).textContent = msg; }
function hideError(id) { document.getElementById(id).classList.remove('show'); }

/* ═══ Login ═══ */
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
        const res = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        document.body.style.animation = 'pageReveal 0.5s var(--ease-out) reverse forwards';
        setTimeout(() => window.location.href = '/dashboard.html', 500);
    } catch (err) {
        showError('login-error', 'login-error-msg', err.message);
    } finally { btn.disabled = false; btnText.textContent = 'Sign In'; }
}

/* ═══ Register ═══ */
async function handleRegister(e) {
    e.preventDefault();
    hideError('register-error');
    document.getElementById('register-success').classList.remove('show');
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const btn = document.getElementById('register-btn');
    const btnText = document.getElementById('register-btn-text');
    if (password.length < 6) { showError('register-error', 'register-error-msg', 'Password must be at least 6 characters.'); return; }
    btn.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span> Creating account...';
    try {
        const res = await fetch(`${API}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        document.body.style.animation = 'pageReveal 0.5s var(--ease-out) reverse forwards';
        setTimeout(() => window.location.href = '/dashboard.html', 500);
    } catch (err) {
        showError('register-error', 'register-error-msg', err.message);
    } finally { btn.disabled = false; btnText.textContent = 'Create Account'; }
}

if (localStorage.getItem('token')) window.location.href = '/dashboard.html';
