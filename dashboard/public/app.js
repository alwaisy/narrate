// State Management
let state = {
    topics: [],
    currentTopic: null,
    currentPost: null,
    isEditing: false,
    originalContent: '',
    showingArchived: false,
    filterQuery: ''
};

const statusConfig = {
    DRAFT: { color: 'gray', icon: 'ph-pencil-line' },
    READY: { color: 'blue', icon: 'ph-check-circle' },
    PUBLISHED: { color: 'green', icon: 'ph-paper-plane-tilt' },
    SKIPPED: { color: 'red', icon: 'ph-prohibit' }
};

// Elements
const dom = {
    topicList: document.getElementById('topic-list'),
    topicFilter: document.getElementById('topic-filter'),
    viewArchiveBtn: document.getElementById('view-archive-btn'),
    archiveBtnText: document.getElementById('archive-btn-text'),
    currentTopicTitle: document.getElementById('current-topic-title'),
    currentTopicDate: document.getElementById('current-topic-date'),
    angleTabs: document.getElementById('angle-tabs'),
    editor: document.getElementById('post-editor'),
    editorContainer: document.getElementById('editor-container'),
    editorView: document.getElementById('editor-view'),
    emptyView: document.getElementById('empty-view'),
    statusBadge: document.getElementById('post-status-badge'),
    statusToggles: document.getElementById('status-toggles'),
    saveStatus: document.getElementById('save-status'),
    copyButton: document.getElementById('copy-to-linkedin-btn')
};

// --- Routing Engine ---
const router = {
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },
    
    async handleRoute() {
        if (state.isEditing) await exitEditMode();
        const hash = window.location.hash || '#/';
        const parts = hash.split('/');
        
        const topicId = parts[2];
        const angleFile = parts[4] ? decodeURIComponent(parts[4]) : null;

        if (topicId) {
            await this.loadTopic(topicId, angleFile);
            dom.copyButton.classList.remove('hidden'); // Show copy button when a post is open
            dom.copyButton.onclick = copyCurrentPost; // Attach event handler
        } else {
            this.showEmpty();
            dom.copyButton.classList.add('hidden'); // Hide copy button when no post is open
        }
    },

    async loadTopic(topicId, angleFile) {
        if (state.isEditing) await exitEditMode();
        
        // Find topic in current list or fetch if not there
        let topic = state.topics.find(t => t.id === topicId);
        if (!topic) {
            await fetchTopics();
            topic = state.topics.find(t => t.id === topicId);
        }

        if (topic) {
            state.currentTopic = topic;
            dom.currentTopicTitle.textContent = topic.title;
            dom.currentTopicDate.textContent = topic.date;
            
            dom.emptyView.classList.add('hidden');
            dom.editorView.classList.remove('hidden');
            
            renderTopics();
            renderAngles();

            // Handle angle selection
            const targetAngle = angleFile || (topic.angles[0]?.raw);
            if (targetAngle) {
                await selectAngle(targetAngle);
            }
        } else {
            this.navigate('/');
        }
    },

    showEmpty() {
        state.currentTopic = null;
        state.currentPost = null;
        dom.currentTopicTitle.textContent = 'Post Scout Dashboard';
        dom.currentTopicDate.textContent = 'Select a topic';
        dom.editorView.classList.add('hidden');
        dom.emptyView.classList.remove('hidden');
        renderTopics();
    },

    navigate(path) {
        window.location.hash = path;
    }
};

// --- Keyboard Handling with Cleanup ---
const keyboard = {
    handler(e) {
        if (!state.isEditing && state.currentPost && (e.key === 'e' || e.key === 'E')) {
            e.preventDefault();
            enterEditMode();
        }
        if (state.isEditing && e.key === 'Escape') {
            e.preventDefault();
            exitEditMode();
        }
    },
    init() {
        document.addEventListener('keydown', this.handler);
    },
    destroy() {
        document.removeEventListener('keydown', this.handler);
    }
};

// --- API Calls ---
async function fetchTopics() {
    try {
        const res = await fetch(`/api/topics?archived=${state.showingArchived}`);
        state.topics = await res.json();
    } catch (err) {
        console.error('Fetch topics failed', err);
        state.topics = [];
    }
}

async function fetchPostContent(topicId, filename) {
    const res = await fetch(`/api/posts/${topicId}/${encodeURIComponent(filename)}`);
    const data = await res.json();
    return data.content;
}

async function savePost(topicId, filename, content) {
    dom.saveStatus.textContent = 'Saving...';
    await fetch(`/api/posts/${topicId}/${encodeURIComponent(filename)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });
    dom.saveStatus.textContent = 'Changes saved';
    setTimeout(() => { if (!state.isEditing) dom.saveStatus.textContent = 'Ready'; }, 2000);
}

// --- Logic ---
function enterEditMode() {
    if (!state.currentPost) return;
    state.isEditing = true;
    state.originalContent = dom.editor.value;
    
    dom.editor.readOnly = false;
    dom.editor.classList.replace('cursor-default', 'cursor-text');
    dom.editor.focus();
    dom.editorContainer.classList.add('ring-2', 'ring-[#0A66C2]', 'border-transparent');
    dom.editIndicator.textContent = 'Edit Mode';
    dom.editIndicator.classList.replace('bg-gray-100', 'bg-[#0A66C2]');
    dom.editIndicator.classList.replace('text-gray-500', 'text-white');
    dom.saveHint.classList.remove('hidden');
}

async function exitEditMode() {
    state.isEditing = false;
    dom.editor.readOnly = true;
    dom.editor.classList.replace('cursor-text', 'cursor-default');
    dom.editorContainer.classList.remove('ring-2', 'ring-[#0A66C2]', 'border-transparent');
    dom.editIndicator.textContent = 'View Mode';
    dom.editIndicator.classList.replace('bg-[#0A66C2]', 'bg-gray-100');
    dom.editIndicator.classList.replace('text-white', 'text-gray-500');
    dom.saveHint.classList.add('hidden');

    if (dom.editor.value !== state.originalContent) {
        await savePost(state.currentTopic.id, state.currentPost.raw, dom.editor.value);
    }
}

async function selectAngle(rawFilename) {
    const angle = state.currentTopic.angles.find(a => a.raw === rawFilename);
    if (!angle) return;

    state.currentPost = angle;
    const content = await fetchPostContent(state.currentTopic.id, angle.raw);
    dom.editor.value = content;
    dom.saveStatus.textContent = 'Ready';
    
    renderAngles();
    renderStatus();
}

async function updateStatus(newStatus, skipConfirm = false) {
    if (!skipConfirm && (newStatus === 'PUBLISHED' || newStatus === 'SKIPPED')) {
        if (!confirm(`Mark as ${newStatus}?`)) return;
    }

    // Capture context immediately to avoid race conditions during navigation
    const targetTopic = state.currentTopic;
    const targetPost = state.currentPost;
    if (!targetTopic || !targetPost) return;

    dom.saveStatus.textContent = 'Updating status...';

    try {
        const res = await fetch(`/api/posts/${targetTopic.id}/${encodeURIComponent(targetPost.raw)}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newStatus })
        });
        const data = await res.json();
        
        if (data.success) {
            // Update the specific post's local state using captured context
            const idx = targetTopic.angles.findIndex(a => a.raw === targetPost.raw);
            if (idx !== -1) {
                targetTopic.angles[idx].status = newStatus;
                targetTopic.angles[idx].raw = data.newFilename;
            }
            
            // Re-fetch all topics to sync with disk
            await fetchTopics();
            
            // Only update URL if we are still looking at the same post
            if (state.currentPost?.raw === targetPost.raw) {
                const newPath = `#/topic/${targetTopic.id}/angle/${encodeURIComponent(data.newFilename)}`;
                router.navigate(newPath);
            }
            
            dom.saveStatus.textContent = 'Status updated';
            setTimeout(() => { if (!state.isEditing) dom.saveStatus.textContent = 'Ready'; }, 2000);
        }
    } catch (err) {
        console.error('Status update failed', err);
        dom.saveStatus.textContent = 'Update failed';
    }
}

async function toggleArchiveTopic(topicId, shouldArchive) {
    if (state.isEditing) await exitEditMode();
    const action = shouldArchive ? 'archive' : 'restore';
    if (!confirm(`Are you sure you want to ${action} this entire topic?`)) return;

    const activeTopicIdBefore = state.currentTopic?.id;

    const res = await fetch(`/api/topics/${topicId}/archived`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: shouldArchive })
    });
    
    if (res.ok) {
        if (activeTopicIdBefore === topicId) router.navigate('#/');
        await fetchTopics();
        renderTopics();
    }
}

// --- Rendering ---
function renderTopics() {
    const filtered = state.topics.filter(t => t.title.toLowerCase().includes(state.filterQuery));
    
    dom.topicList.innerHTML = filtered.map(topic => `
        <div class="group relative flex items-center gap-1">
            <a href="#/topic/${topic.id}" 
                class="flex-1 text-left px-4 py-3 rounded-xl transition-all ${state.currentTopic?.id === topic.id ? 'bg-[#0A66C2] text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}">
                <span class="text-sm font-medium truncate pr-2">${topic.title}</span>
            </a>
            <button onclick="event.stopPropagation(); toggleArchiveTopic('${topic.id}', ${!state.showingArchived})" 
                class="p-2 rounded-xl transition-all ${state.showingArchived ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}">
                <i class="ph-bold ${state.showingArchived ? 'ph-tray-arrow-up' : 'ph-tray-arrow-down'} text-lg"></i>
            </button>
        </div>
    `).join('');
}

function renderAngles() {
    if (!state.currentTopic) return;
    dom.angleTabs.innerHTML = state.currentTopic.angles.map(angle => {
        const config = statusConfig[angle.status];
        const isActive = state.currentPost?.raw === angle.raw;
        return `
            <a href="#/topic/${state.currentTopic.id}/angle/${encodeURIComponent(angle.raw)}" 
                class="px-3 py-1.5 text-xs font-semibold rounded-full border transition-all flex items-center gap-1.5 
                ${isActive 
                    ? `bg-${config.color}-50 text-${config.color}-700 border-${config.color}-200` 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}">
                <i class="ph-fill ${config.icon} text-${config.color}-500"></i>
                ${angle.name.split('_')[1] || 'Angle'}
            </a>
        `;
    }).join('');
}

function renderStatus() {
    if (!state.currentPost) return;
    const config = statusConfig[state.currentPost.status];
    dom.statusBadge.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-${config.color}-100 text-${config.color}-700">
            <i class="ph-bold ${config.icon}"></i>
            ${state.currentPost.status}
        </span>
    `;
    dom.statusToggles.innerHTML = Object.keys(statusConfig).map(status => {
        const s = statusConfig[status];
        return `
            <button onclick="updateStatus('${status}')"
                class="w-8 h-8 flex items-center justify-center rounded-md transition-all ${state.currentPost.status === status ? `bg-white shadow-sm text-${s.color}-600` : 'text-gray-400 hover:text-gray-600'}">
                <i class="ph-bold ${s.icon}"></i>
            </button>
        `;
    }).join('');
}

async function copyCurrentPost() {
    if (!state.currentPost) return;
    const res = await fetch('/api/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: dom.editor.value })
    });
    if (res.ok) {
        dom.saveStatus.textContent = 'Copied to clipboard!';
        if (state.currentPost.status === 'READY') await updateStatus('PUBLISHED', true); // Bypass confirmation
        setTimeout(() => dom.saveStatus.textContent = 'Ready', 3000);
    }
}

// --- Initialization ---
async function init() {
    await fetchTopics();
    keyboard.init();
    router.init();
    
    dom.topicFilter.addEventListener('input', (e) => {
        state.filterQuery = e.target.value.toLowerCase();
        renderTopics();
    });

    dom.viewArchiveBtn.addEventListener('click', async () => {
        state.showingArchived = !state.showingArchived;
        dom.archiveBtnText.textContent = state.showingArchived ? 'View Active Posts' : 'View Archives';
        dom.viewArchiveBtn.classList.toggle('bg-blue-50');
        dom.viewArchiveBtn.classList.toggle('text-[#0A66C2]');
        await fetchTopics();
        renderTopics();
    });
}

init();
