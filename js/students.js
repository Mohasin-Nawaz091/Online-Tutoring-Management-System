/**
 * students.js – Student-specific UI logic
 */

/* Render the student dashboard stats and sessions dynamically */
async function initStudentDashboard() {
    await initData();
    const user = requireAuth(['student']);
    if (!user) return;

    // Update name/greeting
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name.split(' ')[0]);
    document.querySelectorAll('[data-user-fullname]').forEach(el => el.textContent = user.name);
    document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email);

    const myBookings = fetchBookingsForStudent(user.id);
    const upcoming = myBookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
    const completed = myBookings.filter(b => b.status === 'completed');

    // Stats
    const elUpcoming = document.getElementById('stat-upcoming');
    const elCompleted = document.getElementById('stat-completed');
    if (elUpcoming) elUpcoming.textContent = upcoming.length;
    if (elCompleted) elCompleted.textContent = completed.length;

    // Upcoming sessions list
    const sessionsList = document.getElementById('upcoming-sessions-list');
    if (sessionsList) {
        if (upcoming.length === 0) {
            sessionsList.innerHTML = `<div class="text-center py-10 text-slate-400">
        <span class="material-symbols-outlined text-5xl block mb-3">event_busy</span>
        <p class="font-medium">No upcoming sessions. <a href="tutor_search.html" class="text-primary font-bold hover:underline">Book one now</a></p>
      </div>`;
        } else {
            sessionsList.innerHTML = upcoming.slice(0, 4).map(b => {
                const tutor = fetchTutorById(b.tutor_id);
                const tutorName = tutor ? tutor.name : 'Unknown Tutor';
                const tutorPhoto = tutor && tutor.photo ? `<img src="${tutor.photo}" class="w-full h-full object-cover rounded-lg">` : tutorName.charAt(0);

                return `
        <div class="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-sm transition-shadow bg-white dark:bg-slate-900">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg overflow-hidden">${tutorPhoto}</div>
            <div>
              <p class="font-bold text-slate-900 dark:text-white">${b.subject}</p>
              <p class="text-sm text-slate-500">with ${tutorName}</p>
              <p class="text-xs text-primary font-semibold mt-1">${formatDate(b.date)} at ${b.time}</p>
            </div>
          </div>
          <div class="flex flex-col items-end gap-2">
            ${statusBadge(b.status)}
            ${b.status === 'confirmed' ? `<button onclick="window.location.href='session_room.html?booking_id=${b.id}'" class="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary/90 transition-all">Enter Room</button>` : ''}
          </div>
        </div>`;
            }).join('');
        }
    }

    // Wire sidebar nav
    wireStudentNav(user);
}

function wireStudentNav(user) {
    const navMap = {
        'nav-dashboard': 'student_dashboard.html',
        'nav-my-bookings': 'student_booking.html',
        'nav-find-tutors': 'tutor_search.html',
        'nav-profile': 'profile_setting.html',
        'nav-logout': null,
    };
    Object.entries(navMap).forEach(([id, href]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('click', (e) => {
            e.preventDefault();
            if (href === null) { logoutUser(); }
            else window.location.href = href;
        });
    });
    // Generic Book New Session button
    document.querySelectorAll('[data-action="book-session"]').forEach(btn => {
        btn.addEventListener('click', () => window.location.href = 'tutor_search.html');
    });
    // Explore tutors button
    document.querySelectorAll('[data-action="explore-tutors"]').forEach(btn => {
        btn.addEventListener('click', () => window.location.href = 'tutor_search.html');
    });
    // View all history / bookings
    document.querySelectorAll('[data-action="view-bookings"]').forEach(btn => {
        btn.addEventListener('click', () => window.location.href = 'student_booking.html');
    });
}

/* ─── Student Bookings Page ───────────────────────────────── */
async function initStudentBookingsPage() {
    await initData();
    const user = requireAuth(['student']);
    if (!user) return;

    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name.split(' ')[0]);
    wireStudentNav(user);
    renderBookingsTable(user.id);
}

function renderBookingsTable(studentId) {
    const bookings = fetchBookingsForStudent(studentId);
    const tbody = document.getElementById('bookings-table-body');
    if (!tbody) return;

    if (bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-slate-400">No bookings found. <a href="tutor_search.html" class="text-primary font-bold">Find a tutor</a></td></tr>`;
        return;
    }

    tbody.innerHTML = bookings.map(b => {
        const tutor = fetchTutorById(b.tutor_id);
        const tutorName = tutor ? tutor.name : 'N/A';
        return `<tr class="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td class="px-5 py-4 font-medium">${tutorName}</td>
      <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${b.subject}</td>
      <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${formatDate(b.date)}</td>
      <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${b.time}</td>
      <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${b.duration}h</td>
      <td class="px-5 py-4">${statusBadge(b.status)}</td>
      <td class="px-5 py-4">
        ${b.status === 'confirmed' ? `<button data-action="cancel-booking" data-id="${b.id}" class="text-red-400 hover:text-red-600 text-sm font-semibold">Cancel</button>` : ''}
      </td>
    </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-action="cancel-booking"]').forEach(btn => {
        btn.addEventListener('click', () => {
            showModal('Cancel Booking', 'Are you sure you want to cancel this session?', async () => {
                await updateBooking(btn.dataset.id, { status: 'rejected' });
                showToast('Booking cancelled.', 'warning');
                renderBookingsTable(studentId);
            });
        });
    });
}
