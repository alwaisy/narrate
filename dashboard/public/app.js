// State Management
let state = {
    topics: [],
    currentTopic: null,
    currentPost: null,
    currentPostMetadata: '',
    currentComments: [],
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
    editIndicator: document.getElementById('edit-indicator'),
    saveHint: document.getElementById('save-hint'),
    copyButton: document.getElementById('copy-to-linkedin-btn'),
    copyPathButton: document.getElementById('copy-path-btn'),
    generatePosterButton: document.getElementById('generate-poster-btn'),
    reportPanel: document.getElementById('report-panel'),
    reportEmpty: document.getElementById('report-empty'),
    reportContent: document.getElementById('report-content'),
    // Poster Preview Elements
    posterPreview: document.getElementById('poster-data-preview'),
    previewHeadline: document.getElementById('preview-headline'),
    previewItems: document.getElementById('preview-items'),
    previewPillarBadge: document.getElementById('preview-pillar-badge'),
    // Comments Preview Elements
    commentsPreview: document.getElementById('comments-preview'),
    commentsList: document.getElementById('comments-list'),
    commentsCount: document.getElementById('comments-count'),
    copyCommentsButton: document.getElementById('copy-comments-btn')
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
            dom.copyButton.classList.remove('hidden');
            dom.copyPathButton.classList.remove('hidden');
            dom.generatePosterButton.classList.remove('hidden');
        } else {
            this.showEmpty();
            dom.copyButton.classList.add('hidden');
            dom.copyPathButton.classList.add('hidden');
            dom.generatePosterButton.classList.add('hidden');
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

            // Load report for this topic
            const report = await fetchReport(topic.id);
            renderReport(report);

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
        dom.reportPanel.classList.add('hidden');
        dom.reportEmpty.classList.add('hidden');
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
    try {
        await fetch(`/api/posts/${topicId}/${encodeURIComponent(filename)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        window.toast?.success('Changes saved successfully');
    } catch (err) {
        console.error('Save failed', err);
        window.toast?.error('Failed to save changes');
    }
}

async function fetchReport(topicId) {
    try {
        const res = await fetch(`/api/reports/${encodeURIComponent(topicId)}`);
        return await res.json();
    } catch (err) {
        console.error('Fetch report failed', err);
        return { found: false, content: null };
    }
}

function renderReport(report) {
    if (!report.found || !report.content) {
        dom.reportPanel.classList.add('hidden');
        dom.reportEmpty.classList.remove('hidden');
        return;
    }

    dom.reportEmpty.classList.add('hidden');
    dom.reportPanel.classList.remove('hidden');

    // Use marked for proper markdown rendering
    const html = marked.parse(report.content);
    dom.reportContent.innerHTML = html;
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
        // Re-attach metadata: POSTER_DATA + comments
        let fullContent = dom.editor.value;
        if (state.currentPostMetadata) {
            fullContent += `\n\n${state.currentPostMetadata}`;
        }
        if (state.currentComments && state.currentComments.length > 0) {
            const commentsBlock = state.currentComments.map(c =>
                `\n\n<!-- [COMMENT_${String(c.index).padStart(2, '0')}] type: "${c.type}" | text: "${c.text}" -->`
            ).join('');
            fullContent += commentsBlock;
        }
        await savePost(state.currentTopic.id, state.currentPost.raw, fullContent);
    }
}

async function selectAngle(rawFilename) {
    const angle = state.currentTopic.angles.find(a => a.raw === rawFilename);
    if (!angle) return;

    state.currentPost = angle;
    const content = await fetchPostContent(state.currentTopic.id, angle.raw);

    // Parse all comment blocks
    const commentRegex = /<!--\s*\[COMMENT_(\d+)\]\s+type:\s*"([^"]+)"\s*\|\s*text:\s*"([^"]+)"\s*-->/g;
    const comments = [];
    let match;
    while ((match = commentRegex.exec(content)) !== null) {
        comments.push({
            index: parseInt(match[1]),
            type: match[2],
            text: match[3]
        });
    }
    state.currentComments = comments;

    // Strip POSTER_DATA and comments to get clean post body
    const posterMetaRegex = /<!--\s*\[POSTER_DATA\].*?-->/s;
    const commentsBlockRegex = /(?:\s*<!--\s*\[COMMENT_\d+\].*?-->)+\s*$/s;

    const posterMatch = content.match(posterMetaRegex);
    state.currentPostMetadata = posterMatch ? posterMatch[0].trim() : '';

    // Get clean post body by stripping both metadata blocks
    let cleanBody = content;
    cleanBody = cleanBody.replace(commentsBlockRegex, '');
    cleanBody = cleanBody.replace(posterMetaRegex, '');
    cleanBody = cleanBody.trim();

    dom.editor.value = cleanBody;

    if (state.currentPostMetadata) {
        renderPosterPreview(state.currentPostMetadata);
    } else {
        dom.posterPreview.classList.add('hidden');
    }

    renderComments(comments);

    if (!dom.saveStatus.textContent.includes('Copied')) {
        dom.saveStatus.textContent = 'Ready';
    }

    renderAngles();
    renderStatus();
}

function renderPosterPreview(rawMetadata) {
    const metaMatch = rawMetadata.match(/\[POSTER_DATA\]\s+headline:\s*"(.*?)"\s*\|\s*description_items:\s*(\[.*?\])\s*\|\s*pillar:\s*"(.*?)"/s);
    
    if (!metaMatch) {
        dom.posterPreview.classList.add('hidden');
        return;
    }

    const [_, headline, itemsJson, pillar] = metaMatch;
    const items = JSON.parse(itemsJson);

    dom.previewHeadline.textContent = headline;
    dom.previewItems.innerHTML = items.map(item => `
        <li class="flex items-start gap-2 text-xs text-gray-600 italic">
            <span class="text-[#0A66C2] font-bold">//</span>
            <span>${item}</span>
        </li>
    `).join('');

    // Style badge based on pillar
    const colors = {
        problem: 'bg-red-50 text-red-700 border-red-100',
        decision: 'bg-blue-50 text-blue-700 border-blue-100',
        honest: 'bg-purple-50 text-purple-700 border-purple-100'
    };
    
    dom.previewPillarBadge.className = `px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${colors[pillar] || 'bg-gray-50'}`;
    dom.previewPillarBadge.textContent = pillar;
    
    dom.posterPreview.classList.remove('hidden');
}

function renderComments(comments) {
    if (!comments || comments.length === 0) {
        dom.commentsPreview.classList.add('hidden');
        return;
    }

    dom.commentsCount.textContent = `${comments.length} comment${comments.length > 1 ? 's' : ''}`;

    const typeColors = {
        question: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
        validation: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
        personal_experience: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
        contrarian_addition: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
        resource_drop: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' }
    };

    const typeLabels = {
        question: 'Question',
        validation: 'Validation',
        personal_experience: 'Personal',
        contrarian_addition: 'Addition',
        resource_drop: 'Resource'
    };

    dom.commentsList.innerHTML = comments.map(comment => {
        const colors = typeColors[comment.type] || typeColors.question;
        const label = typeLabels[comment.type] || comment.type;

        return `
            <div class="group relative p-3 rounded-lg border ${colors.border} ${colors.bg}">
                <button data-comment-idx="${comment.index}" class="copy-comment-btn absolute top-2 right-2 p-1.5 rounded-md bg-white/80 border border-gray-200 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-[#0A66C2] hover:border-[#0A66C2] transition-all">
                    <i class="ph ph-copy text-xs"></i>
                </button>
                <div class="flex items-center gap-2 mb-2 pr-8">
                    <span class="w-1.5 h-1.5 rounded-full ${colors.dot}"></span>
                    <span class="text-[9px] font-bold uppercase tracking-widest ${colors.text}">${label}</span>
                    <span class="text-[9px] text-gray-400 ml-auto">#${comment.index}</span>
                </div>
                <p class="text-xs text-gray-700 leading-relaxed italic">${comment.text}</p>
            </div>
        `;
    }).join('');

    // Attach click listeners to all copy buttons
    dom.commentsList.querySelectorAll('.copy-comment-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.commentIdx);
            const comment = comments.find(c => c.index === idx);
            if (!comment) return;

            try {
                await navigator.clipboard.writeText(comment.text);
                const icon = btn.querySelector('i');
                icon.className = 'ph ph-check text-xs text-green-600';
                window.toast?.success(`Comment #${idx} copied`);
                setTimeout(() => {
                    icon.className = 'ph ph-copy text-xs';
                }, 2000);
            } catch (err) {
                console.error('Copy failed', err);
                window.toast?.error('Copy failed');
            }
        });
    });

    dom.commentsPreview.classList.remove('hidden');
}

async function updateStatus(newStatus, skipConfirm = false) {
    if (!skipConfirm && (newStatus === 'PUBLISHED' || newStatus === 'SKIPPED')) {
        if (!confirm(`Mark as ${newStatus}?`)) return;
    }

    const targetTopic = state.currentTopic;
    const targetPost = state.currentPost;
    if (!targetTopic || !targetPost) return;

    try {
        const res = await fetch(`/api/posts/${targetTopic.id}/${encodeURIComponent(targetPost.raw)}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newStatus })
        });
        const data = await res.json();
        
        if (data.success) {
            const idx = targetTopic.angles.findIndex(a => a.raw === targetPost.raw);
            if (idx !== -1) {
                targetTopic.angles[idx].status = newStatus;
                targetTopic.angles[idx].raw = data.newFilename;
            }
            await fetchTopics();
            if (state.currentPost?.raw === targetPost.raw) {
                const newPath = `#/topic/${targetTopic.id}/angle/${encodeURIComponent(data.newFilename)}`;
                router.navigate(newPath);
            }
            window.toast?.success(`Status: ${newStatus}`);
        }
    } catch (err) {
        console.error('Status update failed', err);
        window.toast?.error('Status update failed');
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
        window.toast?.success(`Topic ${shouldArchive ? 'archived' : 'restored'}`);
    } else {
        window.toast?.error(`Failed to ${action} topic`);
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
    try {
        if (state.isEditing) await exitEditMode();
        if (!state.currentPost) return;
        const content = dom.editor.value;
        await navigator.clipboard.writeText(content);
        
        if (state.currentPost.status === 'READY' || state.currentPost.status === 'DRAFT') {
            await updateStatus('PUBLISHED', true);
            window.toast?.success('Copied & Published!');
        } else {
            window.toast?.success('Copied to clipboard!');
        }
    } catch (err) {
        console.error('Copy failed', err);
        window.toast?.error('Copy failed');
    }
}

async function copyPostPath() {
    if (!state.currentTopic || !state.currentPost) return;
    const path = `content/posts/${state.currentTopic.id}/${state.currentPost.raw}`;
    try {
        await navigator.clipboard.writeText(path);
        window.toast?.info('File path copied');
    } catch (err) {
        console.error('Failed to copy path', err);
        window.toast?.error('Copy failed');
    }
}

async function generatePoster() {
    if (state.isEditing) await exitEditMode();
    if (!state.currentPost) return;

    // Use currentPostMetadata if it exists (the "Shadow" metadata)
    const contentToParse = state.currentPostMetadata || dom.editor.value;

    // Improved regex: handles newlines (\s), multiple spaces
    const metaMatch = contentToParse.match(/\[POSTER_DATA\]\s+headline:\s*"(.*?)"\s*\|\s*description_items:\s*(\[.*?\])\s*\|\s*pillar:\s*"(.*?)"/s);

    let params = new URLSearchParams();

    if (metaMatch) {
        params.set('headline', metaMatch[1].trim());
        params.set('descriptionItems', metaMatch[2].trim());
        params.set('pillar', metaMatch[3].trim());
        window.toast?.info('Using POSTER_DATA metadata');
    } else {
        // Fallback: Smart heuristic
        const lines = dom.editor.value.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('<!--'));

        const headline = lines.slice(0, 2).join(' ').slice(0, 100);
        params.set('headline', headline || 'My Headline');

        const descLines = lines.slice(2, 4);
        params.set('descriptionItems', JSON.stringify(descLines));

        const pillarMatch = state.currentPost.raw.match(/_([a-z]+)_angle/);
        params.set('pillar', pillarMatch ? pillarMatch[1] : 'problem');
        window.toast?.warn('No POSTER_DATA found, using fallback');
    }

    params.set('date', state.currentTopic.date.split(' ')[0] || new Date().toISOString().slice(0, 10));
    window.open(`/poster?${params.toString()}`, '_blank');
}

async function copyAllComments() {
    if (!state.currentComments || state.currentComments.length === 0) {
        window.toast?.warn('No comments to copy');
        return;
    }

    const text = state.currentComments.map(c => c.text).join('\n\n');
    try {
        await navigator.clipboard.writeText(text);
        window.toast?.success(`${state.currentComments.length} comment(s) copied`);
    } catch (err) {
        console.error('Copy failed', err);
        window.toast?.error('Copy failed');
    }
}

async function generateComments() {
    if (state.isEditing) await exitEditMode();
    if (!state.currentPost) return;

    const postPath = `content/posts/${state.currentTopic.id}/${state.currentPost.raw}`;
    
    try {
        await navigator.clipboard.writeText(postPath);
        window.toast?.info('Post path copied. Run: /comment <path>');
    } catch (err) {
        console.error('Copy failed', err);
        window.toast?.error('Copy failed');
    }
}

// --- Initialization ---
async function init() {
    await fetchTopics();
    keyboard.init();
    router.init();

    dom.copyButton.onclick = copyCurrentPost;
    dom.copyPathButton.onclick = copyPostPath;
    dom.generatePosterButton.onclick = generatePoster;
    dom.generateCommentsButton.onclick = generateComments;
    dom.copyCommentsButton.onclick = copyAllComments;

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
