const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const pino = require('pino');
const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: { colorize: true }
    }
});

const app = express();
const PORT = 3000;

// Paths to your posts
const POSTS_DIR = path.join(__dirname, '../content/posts');
const ARCHIVE_DIR = path.join(__dirname, '../content/archive');

// Ensure directories exist
if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to parse status from filename
const getStatusAndName = (filename) => {
    const match = filename.match(/^\[(DRAFT|READY|PUBLISHED|SKIPPED|ARCHIVED)\]-(.*)/);
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

                    const format1 = topicDir.match(/^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-(AM|PM))_(.*)/);
                    const format2 = topicDir.match(/^(\d{8})_(\d{4})_(.*)/);

                    if (format1) {
                        dateStr = `${format1[1]} at ${format1[2].replace(/-/g, ':')}`;
                        cleanTitle = format1[4];
                    } else if (format2) {
                        const d = format2[1];
                        const t = format2[2];
                        dateStr = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)} at ${t.slice(0,2)}:${t.slice(2,4)}`;
                        cleanTitle = format2[3];
                    }

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

// 6. Copy to clipboard
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
