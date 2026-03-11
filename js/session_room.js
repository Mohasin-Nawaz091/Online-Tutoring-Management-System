/**
 * session_room.js
 * Logic for the chat, notes, and session interaction
 */

async function initSessionRoom() {
    await initData();
    const user = getCurrentUser();
    if (!user) { window.location.href = 'login.html'; return; }

    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('booking_id');

    if (!bookingId) {
        alert('No session ID provided.');
        history.back();
        return;
    }

    const booking = fetchBookings().find(b => b.id === bookingId);
    if (!booking) {
        alert('Session not found.');
        history.back();
        return;
    }

    // Load Participant Information
    const otherUserId = (user.role === 'tutor') ? booking.student_id : booking.tutor_id;
    const items = (user.role === 'tutor') ? fetchStudents() : fetchTutors();
    const otherUser = items.find(u => u.id === otherUserId);

    if (otherUser) {
        document.getElementById('parti-name').textContent = otherUser.name;
        document.getElementById('parti-role').textContent = (user.role === 'tutor') ? 'Student' : 'Professional Tutor';
        const avatar = document.getElementById('parti-avatar');
        if (otherUser.photo) {
            avatar.innerHTML = `<img src="${otherUser.photo}" class="w-full h-full object-cover rounded-full">`;
        } else {
            avatar.textContent = otherUser.name.charAt(0).toUpperCase();
        }
    }

    // Load initial data
    loadMessages(bookingId, user.id);
    loadNotes(bookingId);

    // Refresh chat every 3 seconds (simple polling)
    setInterval(() => loadMessages(bookingId, user.id), 3000);

    // Chat form
    const chatForm = document.getElementById('chat-form');
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        try {
            await sendMessage({
                booking_id: bookingId,
                sender_id: user.id,
                text: text
            });
            loadMessages(bookingId, user.id);
        } catch (err) {
            console.error(err);
        }
    });

    // Note saving
    document.getElementById('save-note-btn').addEventListener('click', async () => {
        const title = document.getElementById('note-title').value.trim();
        const content = document.getElementById('note-content').value.trim();
        if (!title || !content) return;

        try {
            await addNote({
                booking_id: bookingId,
                title,
                content
            });
            document.getElementById('note-modal').style.display = 'none';
            document.getElementById('note-title').value = '';
            document.getElementById('note-content').value = '';
            loadNotes(bookingId);
        } catch (err) {
            console.error(err);
        }
    });
}

async function loadMessages(bookingId, currentUserId) {
    try {
        const msgs = await fetchMessages(bookingId);
        const container = document.getElementById('messages-container');
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;

        container.innerHTML = msgs.map(m => {
            const isMe = m.sender_id === currentUserId;
            return `
                <div class="flex ${isMe ? 'justify-end' : 'justify-start'}">
                    <div class="max-w-[70%] ${isMe ? 'bg-primary text-white rounded-l-xl rounded-tr-xl' : 'bg-white border border-slate-200 rounded-r-xl rounded-tl-xl'} p-3 shadow-sm">
                        <p class="text-sm">${m.text}</p>
                        <p class="text-[10px] mt-1 opacity-70 text-right">${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
            `;
        }).join('');

        if (isAtBottom) container.scrollTop = container.scrollHeight;
    } catch (e) {
        console.error('Failed to load messages', e);
    }
}

async function loadNotes(bookingId) {
    try {
        const notes = await fetchNotes(bookingId);
        const container = document.getElementById('notes-list');
        if (notes.length === 0) {
            container.innerHTML = '<p class="text-center text-slate-400 py-10 text-sm">No notes shared yet.</p>';
            return;
        }

        container.innerHTML = notes.map(n => {
            const isLink = n.content.startsWith('http');
            return `
                <div class="p-3 rounded-lg border border-slate-100 hover:border-primary/30 transition-all bg-slate-50 relative group">
                    <h4 class="font-bold text-xs truncate pr-6">${n.title}</h4>
                    ${isLink ?
                    `<a href="${n.content}" target="_blank" class="text-[10px] text-primary hover:underline truncate block mt-1">${n.content}</a>` :
                    `<p class="text-[10px] text-slate-500 mt-1 line-clamp-2">${n.content}</p>`
                }
                    <button onclick="handleDeleteNote(${n.id}, '${bookingId}')" class="absolute right-2 top-2 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <span class="material-symbols-outlined text-xs">delete</span>
                    </button>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Failed to load notes', e);
    }
}

async function handleDeleteNote(id, bookingId) {
    if (confirm('Delete this note?')) {
        await deleteNote(id);
        loadNotes(bookingId);
    }
}

function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
    alert("Meeting link copied to clipboard!");
}

document.addEventListener('DOMContentLoaded', initSessionRoom);
