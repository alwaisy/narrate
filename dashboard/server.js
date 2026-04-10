const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { exec } = require('child_process');
const pino = require('pino');
const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: { colorize: true }
    }
});

const app = express();
const PORT = process.env.PORT || 6842;

// Paths to your posts
const POSTS_DIR = path.join(__dirname, '../content/posts');
const ARCHIVE_DIR = path.join(__dirname, '../content/archive');
const REPORTS_DIR = path.join(__dirname, '../reports');

// Ensure directories exist
if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to parse status from filename
const getStatusAndName = (filename) => {
    const match = filename.match(/^\[(DRAFT|READY|PUBLISHED|SKIPPED)\]-(.*)/);
    if (match) {
        return { status: match[1], name: match[2], raw: filename };
    }
    const oldSkipMatch = filename.match(/^\[skipped\]-(.*)/);
    if (oldSkipMatch) return { status: 'SKIPPED', name: oldSkipMatch[1], raw: filename };
    
    return { status: 'DRAFT', name: filename, raw: filename };
};

// 1. Get topics (accepts ?archived=true query)
app.get('/api/topics', (req, res) => {
    const isArchived = req.query.archived === 'true';
    const targetDir = isArchived ? ARCHIVE_DIR : POSTS_DIR;

    logger.info({ targetDir, isArchived }, 'Fetching topics');

    try {
        if (!fs.existsSync(targetDir)) {
            logger.warn({ targetDir }, 'Target directory does not exist');
            return res.json([]);
        }

        const topics = fs.readdirSync(targetDir)
            .filter(file => {
                try {
                    return fs.statSync(path.join(targetDir, file)).isDirectory();
                } catch (e) {
                    logger.error({ file, error: e.message }, 'Failed to stat file');
                    return false;
                }
            })
            .map(topicDir => {
                try {
                    const topicPath = path.join(targetDir, topicDir);
                    const angles = fs.readdirSync(topicPath)
                        .filter(file => file.endsWith('.md') || file.endsWith('.txt'))
                        .map(getStatusAndName)
                        .sort((a, b) => a.name.localeCompare(b.name)); // Sort by numerical name, not status prefix
                    let dateStr = 'Unknown';
                    let cleanTitle = topicDir;

                    // Flexible "Best-Effort" Parsing Logic
                    const match = topicDir.match(/^([\d_-]+(?:AM|PM)?(?:-[A-Z]{3,4})?)_(.*)/);

                    if (match) {
                        // We successfully isolated a timestamp and a slug
                        dateStr = match[1].replace(/_/g, ' ').replace(/-/g, ':'); // A rough but readable format
                        cleanTitle = match[2]; // The rest is the slug
                    }
                    
                    // Always clean the final title slug
                    cleanTitle = cleanTitle.replace(/-/g, ' ').replace(/_/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    cleanTitle = cleanTitle.replace(/-/g, ' ').replace(/_/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');

                    return {
                        id: topicDir,
                        date: dateStr,
                        title: cleanTitle,
                        angles: angles,
                        isArchived: isArchived
                    };

                } catch (e) {
                    logger.error({ topicDir, error: e.message }, 'Error processing topic directory');
                    return null;
                }
            })
            .filter(t => t !== null)
            .sort((a, b) => b.id.localeCompare(a.id));

        res.json(topics);
    } catch (err) {
        logger.error({ error: err.message, stack: err.stack }, 'Failed to fetch topics');
        res.status(500).json({ error: 'Failed to read directory' });
    }
});

// 2. Get Post Content
app.get('/api/posts/:topic/:filename', (req, res) => {
    const { topic, filename } = req.params;
    let filePath = path.join(POSTS_DIR, topic, filename);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(ARCHIVE_DIR, topic, filename);
    }

    if (!fs.existsSync(filePath)) {
        logger.error({ topic, filename }, 'Post not found');
        return res.status(404).json({ error: 'Post not found' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ content });
});

// 3. Save Post Content
app.put('/api/posts/:topic/:filename', (req, res) => {
    const { topic, filename } = req.params;
    const { content } = req.body;
    let filePath = path.join(POSTS_DIR, topic, filename);
    if (!fs.existsSync(filePath)) filePath = path.join(ARCHIVE_DIR, topic, filename);

    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        logger.info({ topic, filename }, 'Post saved');
        res.json({ success: true });
    } catch (err) {
        logger.error({ topic, filename, error: err.message }, 'Failed to save post');
        res.status(500).json({ error: 'Failed to save post' });
    }
});

// 4. Update status (rename file)
app.patch('/api/posts/:topic/:filename/status', (req, res) => {
    const { topic, filename } = req.params;
    const { newStatus } = req.body;
    
    let topicPath = path.join(POSTS_DIR, topic);
    if (!fs.existsSync(topicPath)) topicPath = path.join(ARCHIVE_DIR, topic);
    
    const oldPath = path.join(topicPath, filename);

    if (!fs.existsSync(oldPath)) {
        logger.error({ topic, filename }, 'Post not found for status update');
        return res.status(404).json({ error: 'Post not found' });
    }

    const { name } = getStatusAndName(filename);
    const newFilename = `[${newStatus}]-${name}`;
    const newPath = path.join(topicPath, newFilename);

    try {
        fs.renameSync(oldPath, newPath);
        logger.info({ topic, from: filename, to: newFilename }, 'Status updated');
        res.json({ success: true, newFilename });
    } catch (err) {
        logger.error({ topic, filename, error: err.message }, 'Failed to update status');
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// 5. Toggle Archive Status for TOPIC
app.patch('/api/topics/:id/archived', (req, res) => {
    const topicId = req.params.id;
    const shouldArchive = req.body.archived;
    
    const sourceDir = shouldArchive ? POSTS_DIR : ARCHIVE_DIR;
    const destDir = shouldArchive ? ARCHIVE_DIR : POSTS_DIR;
    
    const sourcePath = path.join(sourceDir, topicId);
    const destPath = path.join(destDir, topicId);

    logger.info({ topicId, shouldArchive, sourcePath, destPath }, 'Attempting archive toggle');

    if (!fs.existsSync(sourcePath)) {
        logger.error({ sourcePath, topicId, shouldArchive }, 'Archive toggle FAILED: Source path does not exist');
        return res.status(404).json({ error: 'Topic not found in source directory' });
    }

    try {
        fs.renameSync(sourcePath, destPath);
        logger.info({ topicId, to: destPath }, 'Archive toggle SUCCESS');
        res.json({ success: true });
    } catch (err) {
        logger.error({ topicId, error: err.message, stack: err.stack }, 'Archive toggle FAILED with error');
        res.status(500).json({ error: 'Failed to move topic' });
    }
});

// 6. Get report for a topic
app.get('/api/reports/:topicId', (req, res) => {
    const topicId = req.params.topicId;

    if (!fs.existsSync(REPORTS_DIR)) {
        return res.json({ found: false, content: null });
    }

    const reports = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.md'));

    // Strategy 1: Extract timestamp prefix from topic and match report filename
    // Topic: "2026-03-24_08-44-PM_reddit-acquisition-trap"
    // Report: "2026-03-24_08-44-PM_session_report.md"
    const tsMatch = topicId.match(/^([\d]{4}-[\d]{2}-[\d]{2}_[\d]{2}-[\d]{2}-(?:AM|PM))/i);
    if (tsMatch) {
        const prefix = tsMatch[1];
        const match = reports.find(r => r.startsWith(prefix));
        if (match) {
            const content = fs.readFileSync(path.join(REPORTS_DIR, match), 'utf-8');
            return res.json({ found: true, filename: match, content });
        }
    }

    // Strategy 2: compact timestamp "20260326_0135" or "260328_0923"
    const compactMatch = topicId.match(/^([\d]{6,8}_[\d]{4})/);
    if (compactMatch) {
        const prefix = compactMatch[1];
        const match = reports.find(r => r.startsWith(prefix));
        if (match) {
            const content = fs.readFileSync(path.join(REPORTS_DIR, match), 'utf-8');
            return res.json({ found: true, filename: match, content });
        }
    }

    // Strategy 3: extract slug from topic and find report containing it
    const slugFromTopic = topicId
        .replace(/^[\d]{4}-[\d]{2}-[\d]{2}[-_][\d]{2}-[\d]{2}-(?:AM|PM)[-_]?/i, '')
        .replace(/^[\d]{6,8}_[\d]{4}[_-]?/, '')
        .replace(/^[\d]{4}-[\d]{2}-[\d]{2}-[\d]{4}[_-]?/, '')
        .toLowerCase();

    if (slugFromTopic) {
        const match = reports.find(r => r.toLowerCase().includes(slugFromTopic));
        if (match) {
            const content = fs.readFileSync(path.join(REPORTS_DIR, match), 'utf-8');
            return res.json({ found: true, filename: match, content });
        }
    }

    // Strategy 4: fuzzy date-only match + most recent
    const dateMatch = topicId.match(/^([\d]{4}-[\d]{2}-[\d]{2})/);
    if (dateMatch) {
        const datePrefix = dateMatch[1];
        const dateMatches = reports.filter(r => r.startsWith(datePrefix));
        if (dateMatches.length > 0) {
            const match = dateMatches.sort().pop();
            const content = fs.readFileSync(path.join(REPORTS_DIR, match), 'utf-8');
            return res.json({ found: true, filename: match, content });
        }
    }

    res.json({ found: false, content: null });
});

// 7. Copy to clipboard
app.post('/api/copy', (req, res) => {
    const { content } = req.body;
    const proc = exec('xclip -selection clipboard', (err) => {
        if (err) {
            logger.error({ error: err.message }, 'Clipboard copy FAILED');
            return res.status(500).json({ error: 'Clipboard error' });
        }
        logger.info('Clipboard copy SUCCESS');
        res.json({ success: true });
    });

    proc.stdin.write(content);
    proc.stdin.end();
});

app.listen(PORT, () => {
    logger.info(`🚀 Dashboard API running at http://localhost:${PORT}`);
});
