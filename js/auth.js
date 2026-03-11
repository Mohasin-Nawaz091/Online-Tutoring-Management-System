/**
 * auth.js – Authentication logic
 * Future: Replace localStorage calls with /api/auth/* endpoints
 */

/* ─── Login ──────────────────────────────────────────────── */
async function loginUser(email, password) {
    try {
        const result = await apiPost('/auth/login', { email, password });
        if (result.success) setCurrentUser(result.user);
        return result;
    } catch (err) {
        const msg = err.data?.message || 'Invalid email or password.';
        return { success: false, message: msg };
    }
}

/* ─── Register ───────────────────────────────────────────── */
async function registerUser({ name, email, phone, password, role }) {
    try {
        const result = await apiPost('/auth/register', { name, email, phone, password, role });
        if (result.success) setCurrentUser(result.user);
        return result;
    } catch (err) {
        const msg = err.data?.message || 'Registration failed.';
        return { success: false, message: msg };
    }
}

/* ─── Logout ─────────────────────────────────────────────── */
function logoutUser() {
    clearCurrentUser();
    window.location.href = 'login.html';
}

/* ─── Route Guard ────────────────────────────────────────── */
function requireAuth(allowedRoles) {
    const user = getCurrentUser();
    if (!user) { window.location.href = 'login.html'; return null; }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        alert('Access denied. Redirecting to your dashboard.');
        redirectToDashboard(user);
        return null;
    }
    return user;
}

function redirectToDashboard(user) {
    if (!user) { window.location.href = 'login.html'; return; }
    if (user.role === 'student') window.location.href = 'student_dashboard.html';
    else if (user.role === 'tutor') window.location.href = 'tutor_dashboard.html';
    else if (user.role === 'admin') window.location.href = 'admin.html';
}

/* ─── DOM helpers ────────────────────────────────────────── */
function showToast(message, type = 'success') {
    let container = document.getElementById('tf-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'tf-toast-container';
        container.style.cssText = 'position:fixed;top:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const bg = type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981';
    toast.style.cssText = `background:${bg};color:white;padding:0.75rem 1.25rem;border-radius:0.5rem;font-family:Lexend,sans-serif;font-size:0.875rem;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.15);min-width:200px;max-width:350px;opacity:0;transform:translateX(100%);transition:all 0.3s ease;`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function showModal(title, message, onConfirm) {
    let overlay = document.getElementById('tf-modal-overlay');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'tf-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);';
    overlay.innerHTML = `
    <div style="background:white;border-radius:1rem;padding:2rem;max-width:400px;width:90%;text-align:center;font-family:Lexend,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <h3 style="font-size:1.25rem;font-weight:700;margin-bottom:0.75rem;color:#0f172a;">${title}</h3>
      <p style="color:#64748b;margin-bottom:1.5rem;font-size:0.9rem;">${message}</p>
      <div style="display:flex;gap:0.75rem;justify-content:center;">
        <button id="tf-modal-cancel" style="padding:0.6rem 1.5rem;border:2px solid #e2e8f0;border-radius:0.5rem;font-weight:600;cursor:pointer;font-family:Lexend,sans-serif;background:white;">Cancel</button>
        <button id="tf-modal-confirm" style="padding:0.6rem 1.5rem;background:#2463eb;color:white;border:none;border-radius:0.5rem;font-weight:600;cursor:pointer;font-family:Lexend,sans-serif;">Confirm</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    document.getElementById('tf-modal-cancel').onclick = () => overlay.remove();
    document.getElementById('tf-modal-confirm').onclick = () => { overlay.remove(); if (onConfirm) onConfirm(); };
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusBadge(status) {
    const map = {
        confirmed: { bg: '#dcfce7', color: '#16a34a', label: 'Confirmed' },
        pending: { bg: '#fef9c3', color: '#ca8a04', label: 'Pending' },
        rejected: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
        completed: { bg: '#e0e7ff', color: '#4f46e5', label: 'Completed' },
    };
    const s = map[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
    return `<span style="background:${s.bg};color:${s.color};padding:0.2rem 0.65rem;border-radius:9999px;font-size:0.75rem;font-weight:700;">${s.label}</span>`;
}
