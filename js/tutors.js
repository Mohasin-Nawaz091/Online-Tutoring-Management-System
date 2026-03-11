/**
 * tutors.js – Tutor-specific UI logic
 */

/* ─── Tutor Dashboard ────────────────────────────────────── */
async function initTutorDashboard() {
    await initData();
    const user = requireAuth(['tutor']);
    if (!user) return;

    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name.split(' ')[0]);
    document.querySelectorAll('[data-user-fullname]').forEach(el => el.textContent = user.name);
    wireTutorNav(user);

    const myBookings = fetchBookingsForTutor(user.id);
    const pending = myBookings.filter(b => b.status === 'pending');
    const confirmed = myBookings.filter(b => b.status === 'confirmed');

    const elRequests = document.getElementById('stat-requests');
    const elSubjects = document.getElementById('stat-subjects');
    const elEarnings = document.getElementById('stat-earnings');
    if (elRequests) elRequests.textContent = pending.length;
    if (elSubjects) elSubjects.textContent = (user.subjects || []).length;
    if (elEarnings) {
        const earned = confirmed.reduce((sum, b) => sum + (b.duration * (user.hourly_price || 0)), 0);
        elEarnings.textContent = `$${earned.toFixed(0)}`;
    }

    // Render pending requests in dashboard sidebar
    renderPendingRequestsMini(user.id);
}

function wireTutorNav(user) {
    const navMap = {
        'nav-dashboard': 'tutor_dashboard.html',
        'nav-session-requests': 'tutor_requests.html',
        'nav-manage-subjects': 'profile_setting.html',
        'nav-availability': 'profile_setting.html',
        'nav-profile': 'profile_setting.html',
        'nav-logout': null,
    };
    Object.entries(navMap).forEach(([id, href]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('click', (e) => {
            e.preventDefault();
            if (href === null) logoutUser();
            else window.location.href = href;
        });
    });
    document.querySelectorAll('[data-action="edit-schedule"]').forEach(btn =>
        btn.addEventListener('click', () => window.location.href = 'profile_setting.html'));
    document.querySelectorAll('[data-action="manage-subjects"]').forEach(btn =>
        btn.addEventListener('click', () => window.location.href = 'profile_setting.html'));
    document.querySelectorAll('[data-action="view-requests"]').forEach(btn =>
        btn.addEventListener('click', () => window.location.href = 'tutor_requests.html'));
}

function renderPendingRequestsMini(tutorId) {
    const container = document.getElementById('pending-requests-mini');
    if (!container) return;
    const pending = fetchBookingsForTutor(tutorId).filter(b => b.status === 'pending').slice(0, 3);
    if (pending.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">No pending requests.</p>';
        return;
    }
    container.innerHTML = pending.map(b => {
        const student = fetchStudentById(b.student_id);
        const name = student ? student.name : 'Unknown';
        return `<div class="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-primary/40 transition-colors">
      <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">${name.charAt(0)}</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">${name}</p>
        <p class="text-xs text-slate-500">${b.subject} • ${formatDate(b.date)}</p>
      </div>
      <div class="flex flex-col gap-1 shrink-0">
        <button data-action="accept-booking" data-id="${b.id}" title="Accept" class="material-symbols-outlined text-green-500 text-xl hover:scale-110 transition-transform cursor-pointer">check_circle</button>
        <button data-action="reject-booking" data-id="${b.id}" title="Reject" class="material-symbols-outlined text-red-400 text-xl hover:scale-110 transition-transform cursor-pointer">cancel</button>
      </div>
    </div>`;
    }).join('');

    container.querySelectorAll('[data-action="accept-booking"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            await updateBooking(btn.dataset.id, { status: 'confirmed' });
            showToast('Booking accepted!');
            await initData(); // Re-sync cache for stats
            renderPendingRequestsMini(tutorId);
            initTutorDashboard();
        });
    });
    container.querySelectorAll('[data-action="reject-booking"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            await updateBooking(btn.dataset.id, { status: 'rejected' });
            showToast('Booking rejected.', 'warning');
            await initData();
            renderPendingRequestsMini(tutorId);
            initTutorDashboard();
        });
    });
}

/* ─── Tutor Requests Page ─────────────────────────────────── */
async function initTutorRequestsPage() {
    await initData();
    const user = requireAuth(['tutor']);
    if (!user) return;

    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name.split(' ')[0]);
    wireTutorNav(user);
    renderAllRequests(user.id);
}

function renderAllRequests(tutorId) {
    const tbody = document.getElementById('requests-table-body');
    if (!tbody) return;
    const bookings = fetchBookingsForTutor(tutorId);

    if (bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-10 text-center text-slate-400">No booking requests yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = bookings.map(b => {
        const student = fetchStudentById(b.student_id);
        const sName = student ? student.name : 'N/A';
        const actions = b.status === 'pending'
            ? `<button data-action="accept-booking" data-id="${b.id}" class="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Accept</button>
         <button data-action="reject-booking" data-id="${b.id}" class="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Reject</button>`
            : (b.status === 'confirmed' ? `<button onclick="window.location.href='session_room.html?booking_id=${b.id}'" class="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Enter Room</button>` : '');
        return `<tr class="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td class="px-5 py-4 font-medium">${sName}</td>
      <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${b.subject}</td>
      <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${formatDate(b.date)}</td>
      <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${b.time}</td>
      <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${b.duration}h</td>
      <td class="px-5 py-4">${statusBadge(b.status)}</td>
      <td class="px-5 py-4"><div class="flex gap-2">${actions}</div></td>
    </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-action="accept-booking"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            await updateBooking(btn.dataset.id, { status: 'confirmed' });
            showToast('Booking accepted!');
            await initData();
            renderAllRequests(tutorId);
        });
    });
    tbody.querySelectorAll('[data-action="reject-booking"]').forEach(btn => {
        btn.addEventListener('click', () => {
            showModal('Reject Booking', 'Reject this session request?', async () => {
                await updateBooking(btn.dataset.id, { status: 'rejected' });
                showToast('Booking rejected.', 'warning');
                await initData();
                renderAllRequests(tutorId);
            });
        });
    });
}

/* ─── Tutor Search Page ───────────────────────────────────── */
async function initTutorSearchPage() {
    await initData();
    const user = getCurrentUser();
    renderTutorCards(fetchTutors());

    // Search bar
    const searchInput = document.getElementById('tutor-search-input');
    const subjectFilter = document.getElementById('filter-subject');
    const minPriceInput = document.getElementById('filter-min-price');
    const maxPriceInput = document.getElementById('filter-max-price');
    const sortSelect = document.getElementById('filter-sort');
    const clearBtn = document.getElementById('clear-filters-btn');

    function applyFilters() {
        let results = fetchTutors();
        const q = searchInput ? searchInput.value.toLowerCase() : '';
        const sub = subjectFilter ? subjectFilter.value : '';
        const min = minPriceInput ? parseFloat(minPriceInput.value) || 0 : 0;
        const max = maxPriceInput ? parseFloat(maxPriceInput.value) || Infinity : Infinity;
        const sort = sortSelect ? sortSelect.value : '';
        const rating4 = document.getElementById('rating-4up');
        const rating3 = document.getElementById('rating-3up');

        if (q) results = results.filter(t => t.name.toLowerCase().includes(q) || (t.subjects || []).join(' ').toLowerCase().includes(q) || (t.bio || '').toLowerCase().includes(q));
        if (sub && sub !== 'All Subjects') results = results.filter(t => (t.subjects || []).some(s => s.toLowerCase().includes(sub.toLowerCase())));
        results = results.filter(t => (t.hourly_price || 0) >= min && (t.hourly_price || 0) <= max);
        if (rating4 && rating4.checked) results = results.filter(t => t.rating >= 4);
        if (rating3 && rating3.checked) results = results.filter(t => t.rating >= 3);

        if (sort === 'price-asc') results.sort((a, b) => a.hourly_price - b.hourly_price);
        else if (sort === 'price-desc') results.sort((a, b) => b.hourly_price - a.hourly_price);
        else if (sort === 'experience') results.sort((a, b) => parseInt(b.experience) - parseInt(a.experience));
        else results.sort((a, b) => b.rating - a.rating);

        renderTutorCards(results);
    }

    [searchInput, subjectFilter, minPriceInput, maxPriceInput, sortSelect].forEach(el => {
        if (el) el.addEventListener('input', applyFilters);
    });
    document.querySelectorAll('[name="rating"]').forEach(el => el.addEventListener('change', applyFilters));

    if (clearBtn) clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (subjectFilter) subjectFilter.value = '';
        if (minPriceInput) minPriceInput.value = '';
        if (maxPriceInput) maxPriceInput.value = '';
        document.querySelectorAll('[name="rating"]').forEach(el => el.checked = false);
        applyFilters();
    });

    // Find Now button from index.html / header
    document.querySelectorAll('[data-action="find-now"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById('hero-search-input');
            if (input && input.value) {
                window.location.href = `tutor_search.html?q=${encodeURIComponent(input.value)}`;
            } else {
                window.location.href = 'tutor_search.html';
            }
        });
    });

    // Pre-fill from URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('q') && searchInput) { searchInput.value = params.get('q'); applyFilters(); }
    if (params.get('tutor_id')) {
        const tutor = fetchTutorById(params.get('tutor_id'));
        if (tutor) window.location.href = `tutor_profile.html?id=${tutor.id}`;
    }
}

function renderTutorCards(tutors) {
    const grid = document.getElementById('tutor-cards-grid');
    if (!grid) return;
    const user = getCurrentUser();
    const countEl = document.getElementById('tutor-results-count');
    if (countEl) countEl.textContent = `Found ${tutors.length} professional educator${tutors.length !== 1 ? 's' : ''} for your goals`;

    if (tutors.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-slate-400">
      <span class="material-symbols-outlined text-6xl block mb-4">search_off</span>
      <p class="font-semibold text-lg">No tutors match your filters.</p>
      <p class="text-sm mt-2">Try adjusting your search criteria.</p>
    </div>`;
        return;
    }

    grid.innerHTML = tutors.map(t => {
        const stars = '★'.repeat(Math.round(t.rating || 0)) + '☆'.repeat(5 - Math.round(t.rating || 0));
        const photo = t.photo ? `<img src="${t.photo}" class="w-full h-full object-cover" alt="${t.name}">` : `<div class="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-4xl font-bold text-primary">${t.name.charAt(0)}</div>`;
        return `<div class="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col group hover:shadow-md transition-shadow">
      <div class="relative h-48">${photo}
        <div class="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1 rounded-lg text-sm font-bold flex items-center gap-1 shadow-sm">
          <span class="text-yellow-400">★</span> ${(t.rating || 0).toFixed(1)}
        </div>
      </div>
      <div class="p-5 flex-1 flex flex-col">
        <div class="mb-3">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">${t.name}</h3>
          <p class="text-primary text-sm font-medium">${(t.subjects || []).slice(0, 2).join(' • ') || 'Expert Tutor'}</p>
        </div>
        <div class="flex flex-wrap gap-2 mb-4">
          ${(t.subjects || []).slice(0, 3).map(s => `<span class="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-300">${s}</span>`).join('')}
        </div>
        <div class="mt-auto flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div class="flex flex-col">
            <span class="text-xs text-slate-500 uppercase font-semibold">Rate</span>
            <span class="text-lg font-bold text-slate-900 dark:text-white">$${t.hourly_price || 0}<span class="text-xs font-normal text-slate-500">/hr</span></span>
          </div>
          <div class="flex gap-2">
            <button data-action="view-profile" data-id="${t.id}" class="border border-primary text-primary px-3 py-2 rounded-lg font-bold text-sm hover:bg-primary/5 transition-all">Profile</button>
            <button data-action="book-tutor" data-id="${t.id}" class="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all">Book</button>
          </div>
        </div>
      </div>
    </div>`;
    }).join('');

    grid.querySelectorAll('[data-action="view-profile"]').forEach(btn => {
        btn.addEventListener('click', () => window.location.href = `tutor_profile.html?id=${btn.dataset.id}`);
    });
    grid.querySelectorAll('[data-action="book-tutor"]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!user || user.role !== 'student') {
                showToast('Please log in as a student to book.', 'warning');
                setTimeout(() => window.location.href = 'login.html', 1500);
                return;
            }
            window.location.href = `booking_page.html?tutor_id=${btn.dataset.id}`;
        });
    });
}

/* ─── Tutor Profile Page ─────────────────────────────────── */
async function initTutorProfilePage() {
    await initData();
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) { window.location.href = 'tutor_search.html'; return; }

    const tutor = fetchTutorById(id);
    if (!tutor) { showToast('Tutor not found.', 'error'); setTimeout(() => window.location.href = 'tutor_search.html', 1500); return; }

    // Fill in all data-* spots
    document.querySelectorAll('[data-tutor-name]').forEach(el => el.textContent = tutor.name);
    document.querySelectorAll('[data-tutor-bio]').forEach(el => el.textContent = tutor.bio || 'Expert educator dedicated to student success.');
    document.querySelectorAll('[data-tutor-experience]').forEach(el => el.textContent = tutor.experience || 'N/A');
    document.querySelectorAll('[data-tutor-rating]').forEach(el => el.textContent = (tutor.rating || 0).toFixed(1));
    document.querySelectorAll('[data-tutor-price]').forEach(el => el.textContent = `$${tutor.hourly_price || 0}`);
    document.querySelectorAll('[data-tutor-photo]').forEach(el => {
        if (tutor.photo) { el.style.backgroundImage = `url('${tutor.photo}')`; }
    });

    const subjectsEl = document.getElementById('tutor-subjects-list');
    if (subjectsEl) {
        subjectsEl.innerHTML = (tutor.subjects || []).map(s =>
            `<span class="px-3 py-1.5 bg-primary/5 text-primary border border-primary/20 rounded-lg text-sm font-medium">${s}</span>`
        ).join('');
    }

    // Book Session button
    document.querySelectorAll('[data-action="book-session"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const user = getCurrentUser();
            if (!user || user.role !== 'student') {
                showToast('Please log in as a student to book.', 'warning');
                setTimeout(() => window.location.href = 'login.html', 1500);
                return;
            }
            window.location.href = `booking_page.html?tutor_id=${tutor.id}`;
        });
    });
}
