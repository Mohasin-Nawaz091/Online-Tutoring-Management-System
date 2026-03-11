/**
 * data.js  –  API Bridge
 *
 * All functions now call the Flask backend at http://localhost:5000/api/*
 * They still maintain the SAME function signatures as before so NO other
 * JS file needs to change.
 *
 * Async wrappers are used internally; pages that already worked with
 * localStorage continue to work because we initialise data on DOMContentLoaded.
 *
 * IMPORTANT: The backend must be running:  cd backend && python app.py
 */

const API_BASE = 'http://localhost:5000/api';

/* ─── Session (unchanged – stays in localStorage) ──────────────────────────── */
function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('tf_current_user')); } catch { return null; }
}
function setCurrentUser(user) {
    localStorage.setItem('tf_current_user', JSON.stringify(user));
}
function clearCurrentUser() {
    localStorage.removeItem('tf_current_user');
}

/* ─── Admin constant ─────────────────────────────────────────────────────────  */
const ADMIN_USER = {
    id: 'admin-1', name: 'Admin', email: 'admin@tutorflow.com',
    password: 'admin123', role: 'admin'
};

/* ─── Generic fetch helpers ──────────────────────────────────────────────────  */
async function apiGet(path) {
    const r = await fetch(API_BASE + path);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}
async function apiPost(path, body) {
    const r = await fetch(API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const json = await r.json();
    if (!r.ok) throw Object.assign(new Error(json.message || 'Request failed'), { data: json });
    return json;
}
async function apiPut(path, body) {
    const r = await fetch(API_BASE + path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}
async function apiDelete(path) {
    const r = await fetch(API_BASE + path, { method: 'DELETE' });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

/* ─────────────────────────────────────────────────────────────────────────────
   SYNCHRONOUS CACHE
   Pages call fetchStudents(), fetchTutors(), etc. synchronously (legacy).
   We keep an in-memory cache that gets populated on page load via initData().
   ───────────────────────────────────────────────────────────────────────────── */
let _students = [];
let _tutors = [];
let _bookings = [];
let _subjects = [];

let _initPromise = null;
async function initData() {
    if (_initPromise) return _initPromise;
    _initPromise = (async () => {
        try {
            [_students, _tutors, _bookings, _subjects] = await Promise.all([
                apiGet('/students/'),
                apiGet('/tutors/'),
                apiGet('/bookings/'),
                apiGet('/subjects/'),
            ]);
        } catch (e) {
            console.warn('[TutorFlow] Backend not reachable, using localStorage fallback.', e.message);
            _useFallback();
        }
    })();
    return _initPromise;
}

function _useFallback() {
    // Falls back to localStorage if the API is down
    _students = JSON.parse(localStorage.getItem('tf_students') || '[]');
    _tutors = JSON.parse(localStorage.getItem('tf_tutors') || '[]');
    _bookings = JSON.parse(localStorage.getItem('tf_bookings') || '[]');
    _subjects = JSON.parse(localStorage.getItem('tf_subjects') || '[]');
}

/* ─── Synchronous reads (from cache) ───────────────────────────────────────── */
function fetchStudents() { return _students; }
function fetchTutors() { return _tutors; }
function fetchBookings() { return _bookings; }
function fetchSubjects() { return _subjects; }
function fetchStudentById(id) { return _students.find(s => s.id === id) || null; }
function fetchTutorById(id) { return _tutors.find(t => t.id === id) || null; }
function fetchBookingsForStudent(sid) { return _bookings.filter(b => b.student_id === sid); }
function fetchBookingsForTutor(tid) { return _bookings.filter(b => b.tutor_id === tid); }

/* ─── Mutating functions (hit API + update cache) ───────────────────────────── */

// Students
function addStudent(data) {
    return apiPost('/students/', data).then(s => { _students.push(s); return s; });
}
function updateStudent(id, data) {
    return apiPut(`/students/${id}`, data).then(s => {
        const i = _students.findIndex(x => x.id === id);
        if (i >= 0) _students[i] = s;
        return s;
    });
}
function deleteStudent(id) {
    return apiDelete(`/students/${id}`).then(() => {
        _students = _students.filter(s => s.id !== id);
    });
}

// Tutors
function addTutor(data) {
    return apiPost('/tutors/', data).then(t => { _tutors.push(t); return t; });
}
function updateTutor(id, data) {
    return apiPut(`/tutors/${id}`, data).then(t => {
        const i = _tutors.findIndex(x => x.id === id);
        if (i >= 0) _tutors[i] = t;
        return t;
    });
}
function deleteTutor(id) {
    return apiDelete(`/tutors/${id}`).then(() => {
        _tutors = _tutors.filter(t => t.id !== id);
    });
}

// Bookings
function addBooking(data) {
    return apiPost('/bookings/', data).then(b => { _bookings.unshift(b); return b; });
}
function updateBooking(id, data) {
    return apiPut(`/bookings/${id}`, data).then(b => {
        const i = _bookings.findIndex(x => x.id === id);
        if (i >= 0) _bookings[i] = b;
        return b;
    });
}
function deleteBooking(id) {
    return apiDelete(`/bookings/${id}`).then(() => {
        _bookings = _bookings.filter(b => b.id !== id);
    });
}

// Subjects
function addSubject(name) {
    return apiPost('/subjects/', { subject_name: name }).then(s => { _subjects.push(s); return s; });
}
function deleteSubject(id) {
    return apiDelete(`/subjects/${id}`).then(() => {
        _subjects = _subjects.filter(s => s.id !== id);
    });
}

// Availability
function fetchAvailability(tutorId) {
    return apiGet(`/availability/${tutorId}`);
}
function updateAvailability(data) {
    return apiPost('/availability/', data);
}

// Messages (Chat)
function fetchMessages(bookingId) {
    return apiGet(`/messages/${bookingId}`);
}
function sendMessage(data) {
    return apiPost('/messages/', data);
}

// Notes
function fetchNotes(bookingId) {
    return apiGet(`/notes/${bookingId}`);
}
function addNote(data) {
    return apiPost('/notes/', data);
}
function deleteNote(id) {
    return apiDelete(`/notes/${id}`);
}

// No automatic initialization here; pages now call init* functions which await initData() explicitly.
document.addEventListener('DOMContentLoaded', () => {
    // We can still trigger initData here to start the fetch as early as possible
    initData();
});
