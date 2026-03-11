/**
 * bookings.js – Booking form and confirmation logic
 */

async function initBookingPage() {
    await initData();
    const user = requireAuth(['student']);
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const tutorId = params.get('tutor_id');
    const tutor = tutorId ? fetchTutorById(tutorId) : null;

    // Populate tutor selector or pre-fill tutor info
    const tutorSelect = document.getElementById('booking-tutor-select');
    if (tutorSelect) {
        const tutors = fetchTutors();
        tutorSelect.innerHTML = `<option value="">Select a tutor...</option>` + tutors.map(t =>
            `<option value="${t.id}" ${t.id === tutorId ? 'selected' : ''}>${t.name} – $${t.hourly_price}/hr</option>`
        ).join('');
        tutorSelect.addEventListener('change', updateTutorInfo);
    }

    function updateTutorInfo() {
        const selId = tutorSelect ? tutorSelect.value : tutorId;
        const selTutor = fetchTutorById(selId);
        if (!selTutor) return;
        document.querySelectorAll('[data-tutor-name]').forEach(el => el.textContent = selTutor.name);
        document.querySelectorAll('[data-tutor-price]').forEach(el => el.textContent = `$${selTutor.hourly_price}/hr`);

        const subjectSelect = document.getElementById('booking-subject');
        if (subjectSelect) {
            subjectSelect.innerHTML = `<option value="">Select subject...</option>` + (selTutor.subjects || []).map(s =>
                `<option value="${s}">${s}</option>`
            ).join('');
        }
        updateTotalCost();
    }

    if (tutor) {
        document.querySelectorAll('[data-tutor-name]').forEach(el => el.textContent = tutor.name);
        document.querySelectorAll('[data-tutor-price]').forEach(el => el.textContent = `$${tutor.hourly_price}/hr`);
        // Populate subjects
        const subjectSelect = document.getElementById('booking-subject');
        if (subjectSelect) {
            subjectSelect.innerHTML = `<option value="">Select subject...</option>` + (tutor.subjects || []).map(s =>
                `<option value="${s}">${s}</option>`
            ).join('');
        }
    }

    // Cost calculator
    function updateTotalCost() {
        const selId = tutorSelect ? tutorSelect.value : tutorId;
        const selTutor = fetchTutorById(selId);
        const durEl = document.getElementById('booking-duration');
        const costEl = document.getElementById('booking-total-cost');
        if (!selTutor || !durEl || !costEl) return;
        const dur = parseFloat(durEl.value) || 1;
        costEl.textContent = `$${(dur * selTutor.hourly_price).toFixed(2)}`;
    }

    const durEl = document.getElementById('booking-duration');
    if (durEl) durEl.addEventListener('change', updateTotalCost);
    updateTotalCost();

    // Min date = today
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
        const today = new Date();
        dateInput.min = today.toISOString().split('T')[0];
        dateInput.value = today.toISOString().split('T')[0];
    }

    // Form submit
    const form = document.getElementById('booking-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const selTutorId = tutorSelect ? tutorSelect.value : tutorId;
            const subject = document.getElementById('booking-subject')?.value;
            const date = document.getElementById('booking-date')?.value;
            const time = document.getElementById('booking-time')?.value;
            const duration = parseFloat(document.getElementById('booking-duration')?.value) || 1;

            if (!selTutorId || !subject || !date || !time) {
                showToast('Please fill in all fields.', 'error');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Sending Request...';

            try {
                await addBooking({
                    student_id: user.id,
                    tutor_id: selTutorId,
                    subject, date, time, duration,
                    status: 'pending',
                });

                showToast('🎉 Booking request sent! Awaiting tutor confirmation.');
                setTimeout(() => window.location.href = 'student_booking.html', 2000);
            } catch (err) {
                showToast('Failed to send booking request.', 'error');
                btn.disabled = false;
                btn.textContent = 'Confirm Booking';
            }
        });
    }
}
