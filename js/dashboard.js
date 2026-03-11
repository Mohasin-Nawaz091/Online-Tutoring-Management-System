/**
 * dashboard.js – Admin dashboard & shared dashboard helpers
 */

/* ─── Admin Dashboard ─────────────────────────────────────── */
async function initAdminDashboard() {
    await initData();
    const user = requireAuth(['admin']);
    if (!user) return;

    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name);

    // Stats
    const students = fetchStudents();
    const tutors = fetchTutors();
    const bookings = fetchBookings();
    const subjects = fetchSubjects();

    setElText('admin-stat-students', students.length);
    setElText('admin-stat-tutors', tutors.length);
    setElText('admin-stat-bookings', bookings.length);
    setElText('admin-stat-subjects', subjects.length);

    // Active tab
    let activeTab = 'students';
    const tabBtns = document.querySelectorAll('[data-admin-tab]');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('bg-primary', 'text-white'));
            btn.classList.add('bg-primary', 'text-white');
            activeTab = btn.dataset.adminTab;
            renderAdminTable(activeTab);
        });
    });
    renderAdminTable(activeTab);

    // Add subject form
    const addSubjectForm = document.getElementById('add-subject-form');
    if (addSubjectForm) {
        addSubjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('new-subject-input');
            if (!input || !input.value.trim()) return;
            const btn = addSubjectForm.querySelector('button');
            btn.disabled = true;
            try {
                await addSubject(input.value.trim());
                input.value = '';
                showToast('Subject added!');
                renderAdminTable('subjects');
                setElText('admin-stat-subjects', fetchSubjects().length);
            } finally {
                btn.disabled = false;
            }
        });
    }

    // Logout
    document.querySelectorAll('[data-action="logout"]').forEach(btn =>
        btn.addEventListener('click', () => logoutUser()));
}

function setElText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function renderAdminTable(tab) {
    const container = document.getElementById('admin-table-container');
    if (!container) return;

    if (tab === 'students') {
        container.innerHTML = buildStudentsTable();
        wireAdminStudentsTable();
    } else if (tab === 'tutors') {
        container.innerHTML = buildTutorsTable();
        wireAdminTutorsTable();
    } else if (tab === 'bookings') {
        container.innerHTML = buildBookingsTable();
        wireAdminBookingsTable();
    } else if (tab === 'subjects') {
        container.innerHTML = buildSubjectsTable();
        wireAdminSubjectsTable();
    }
}

/* ─── Students Table ─────────────────────────────────────── */
function buildStudentsTable() {
    const students = fetchStudents();
    return `<table class="w-full text-left border-collapse">
    <thead class="bg-slate-50 dark:bg-slate-800">
      <tr>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Name</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Email</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Phone</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
      ${students.length === 0 ? `<tr><td colspan="4" class="px-5 py-8 text-center text-slate-400">No students found.</td></tr>` :
            students.map(s => `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" data-row-id="${s.id}">
          <td class="px-5 py-4 font-medium">${s.name}</td>
          <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${s.email}</td>
          <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${s.phone || 'N/A'}</td>
          <td class="px-5 py-4"><button data-admin-delete="student" data-id="${s.id}" class="text-red-400 hover:text-red-600 text-sm font-semibold">Delete</button></td>
        </tr>`).join('')}
    </tbody>
  </table>`;
}
function wireAdminStudentsTable() {
    document.querySelectorAll('[data-admin-delete="student"]').forEach(btn => {
        btn.addEventListener('click', () => {
            showModal('Delete Student', `Delete this student account? This cannot be undone.`, async () => {
                await deleteStudent(btn.dataset.id);
                showToast('Student deleted.', 'warning');
                renderAdminTable('students');
                setElText('admin-stat-students', fetchStudents().length);
            });
        });
    });
}

/* ─── Tutors Table ───────────────────────────────────────── */
function buildTutorsTable() {
    const tutors = fetchTutors();
    return `<table class="w-full text-left border-collapse">
    <thead class="bg-slate-50 dark:bg-slate-800">
      <tr>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Name</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Email</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Subjects</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Rating</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Rate</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
      ${tutors.length === 0 ? `<tr><td colspan="6" class="px-5 py-8 text-center text-slate-400">No tutors found.</td></tr>` :
            tutors.map(t => `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <td class="px-5 py-4 font-medium">${t.name}</td>
          <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${t.email}</td>
          <td class="px-5 py-4 text-slate-600 dark:text-slate-400 text-sm">${(t.subjects || []).join(', ') || 'N/A'}</td>
          <td class="px-5 py-4"><span class="text-yellow-500">★</span> ${(t.rating || 0).toFixed(1)}</td>
          <td class="px-5 py-4 font-bold text-slate-900 dark:text-white">$${t.hourly_price || 0}/hr</td>
          <td class="px-5 py-4"><button data-admin-delete="tutor" data-id="${t.id}" class="text-red-400 hover:text-red-600 text-sm font-semibold">Delete</button></td>
        </tr>`).join('')}
    </tbody>
  </table>`;
}
function wireAdminTutorsTable() {
    document.querySelectorAll('[data-admin-delete="tutor"]').forEach(btn => {
        btn.addEventListener('click', () => {
            showModal('Delete Tutor', 'Delete this tutor account? This cannot be undone.', async () => {
                await deleteTutor(btn.dataset.id);
                showToast('Tutor deleted.', 'warning');
                renderAdminTable('tutors');
                setElText('admin-stat-tutors', fetchTutors().length);
            });
        });
    });
}

/* ─── Bookings Table ─────────────────────────────────────── */
function buildBookingsTable() {
    const bookings = fetchBookings();
    return `<table class="w-full text-left border-collapse">
    <thead class="bg-slate-50 dark:bg-slate-800">
      <tr>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Student</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Tutor</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Subject</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Date</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Time</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Status</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
      ${bookings.length === 0 ? `<tr><td colspan="7" class="px-5 py-8 text-center text-slate-400">No bookings found.</td></tr>` :
            bookings.map(b => {
                const student = fetchStudentById(b.student_id);
                const tutor = fetchTutorById(b.tutor_id);
                return `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="px-5 py-4 font-medium">${student ? student.name : 'N/A'}</td>
            <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${tutor ? tutor.name : 'N/A'}</td>
            <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${b.subject}</td>
            <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${formatDate(b.date)}</td>
            <td class="px-5 py-4 text-slate-600 dark:text-slate-400">${b.time}</td>
            <td class="px-5 py-4">${statusBadge(b.status)}</td>
            <td class="px-5 py-4"><button data-admin-delete="booking" data-id="${b.id}" class="text-red-400 hover:text-red-600 text-sm font-semibold">Delete</button></td>
          </tr>`;
            }).join('')}
    </tbody>
  </table>`;
}
function wireAdminBookingsTable() {
    document.querySelectorAll('[data-admin-delete="booking"]').forEach(btn => {
        btn.addEventListener('click', () => {
            showModal('Delete Booking', 'Delete this booking record?', async () => {
                await deleteBooking(btn.dataset.id);
                showToast('Booking deleted.', 'warning');
                renderAdminTable('bookings');
                setElText('admin-stat-bookings', fetchBookings().length);
            });
        });
    });
}

/* ─── Subjects Table ─────────────────────────────────────── */
function buildSubjectsTable() {
    const subjects = fetchSubjects();
    return `<table class="w-full text-left border-collapse">
    <thead class="bg-slate-50 dark:bg-slate-800">
      <tr>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Subject Name</th>
        <th class="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
      ${subjects.length === 0 ? `<tr><td colspan="2" class="px-5 py-8 text-center text-slate-400">No subjects found.</td></tr>` :
            subjects.map(s => `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <td class="px-5 py-4 font-medium">${s.subject_name}</td>
          <td class="px-5 py-4"><button data-admin-delete="subject" data-id="${s.id}" class="text-red-400 hover:text-red-600 text-sm font-semibold">Delete</button></td>
        </tr>`).join('')}
    </tbody>
  </table>`;
}
function wireAdminSubjectsTable() {
    document.querySelectorAll('[data-admin-delete="subject"]').forEach(btn => {
        btn.addEventListener('click', () => {
            showModal('Delete Subject', 'Delete this subject?', async () => {
                await deleteSubject(btn.dataset.id);
                showToast('Subject deleted.', 'warning');
                renderAdminTable('subjects');
                setElText('admin-stat-subjects', fetchSubjects().length);
            });
        });
    });
}

/* ─── Profile Settings Page ──────────────────────────────── */
async function initProfilePage() {
    await initData();
    const user = requireAuth(['student', 'tutor', 'admin']);
    if (!user) return;

    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name);
    document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email);

    // Fill form
    const nameInput = document.getElementById('profile-name');
    const phoneInput = document.getElementById('profile-phone');
    const bioInput = document.getElementById('profile-bio');
    const priceInput = document.getElementById('profile-price');
    const subjInput = document.getElementById('profile-subjects');
    const expInput = document.getElementById('profile-experience');

    const photoInput = document.getElementById('profile-photo');

    if (nameInput) nameInput.value = user.name || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (photoInput) photoInput.value = user.photo || '';

    if (user.role === 'tutor') {
        if (bioInput) bioInput.value = user.bio || '';
        if (priceInput) priceInput.value = user.hourly_price || '';
        if (subjInput) subjInput.value = (user.subjects || []).join(', ');
        if (expInput) expInput.value = user.experience || '';
    }

    const form = document.getElementById('profile-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Saving...';

            const updates = {
                name: nameInput ? nameInput.value.trim() : user.name,
                phone: phoneInput ? phoneInput.value.trim() : user.phone,
                photo: photoInput ? photoInput.value.trim() : user.photo,
            };
            if (user.role === 'tutor') {
                updates.bio = bioInput ? bioInput.value.trim() : user.bio;
                updates.hourly_price = priceInput ? parseFloat(priceInput.value) : user.hourly_price;
                updates.subjects = subjInput ? subjInput.value.split(',').map(s => s.trim()).filter(Boolean) : user.subjects;
                updates.experience = expInput ? expInput.value.trim() : user.experience;
            }

            try {
                let updated;
                if (user.role === 'student') updated = await updateStudent(user.id, updates);
                else if (user.role === 'tutor') updated = await updateTutor(user.id, updates);

                if (updated) {
                    setCurrentUser(updated);
                    showToast('Profile updated successfully!');
                    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = updated.name);
                }
            } finally {
                btn.disabled = false;
                btn.textContent = 'Save Changes';
            }
        });
    }

    // Wire logout
    document.querySelectorAll('[data-action="logout"]').forEach(btn =>
        btn.addEventListener('click', () => logoutUser()));

    // Wire nav based on role
    if (user.role === 'student') wireStudentNav(user);
    else if (user.role === 'tutor') wireTutorNav(user);
}
