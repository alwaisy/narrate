import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { logger as honoLogger } from 'hono/logger';
import { cors } from 'hono/cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import pino from 'pino';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: { colorize: true }
    }
});

const app = new Hono();
const PORT = process.env.PORT || 6842;

const POSTS_DIR = path.join(__dirname, '../content/posts');
const ARCHIVE_DIR = path.join(__dirname, '../content/archive');
const REPORTS_DIR = path.join(__dirname, '../reports');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

app.use('*', honoLogger());
app.use('*', cors());

// Use absolute paths for serving static files
app.use('/*', serveStatic({ 
    root: path.relative(process.cwd(), PUBLIC_DIR) 
}));
app.get('/', serveStatic({ 
    path: path.relative(process.cwd(), path.join(PUBLIC_DIR, 'index.html')) 
}));

const getStatusAndName = (filename) => {
    const match = filename.match(/^\[(DRAFT|READY|PUBLISHED|SKIPPED)\]-(.*)/);
    if (match) return { status: match[1], name: match[2], raw: filename };
    const oldSkipMatch = filename.match(/^\[skipped\]-(.*)/);
    if (oldSkipMatch) return { status: 'SKIPPED', name: oldSkipMatch[1], raw: filename };
    return { status: 'DRAFT', name: filename, raw: filename };
};

app.get('/api/topics', (c) => {
    const isArchived = c.req.query('archived') === 'true';
    const targetDir = isArchived ? ARCHIVE_DIR : POSTS_DIR;
    logger.info({ targetDir, isArchived }, 'Fetching topics');
    try {
        if (!fs.existsSync(targetDir)) return c.json([]);
        const topics = fs.readdirSync(targetDir)
            .filter(file => {
                try { return fs.statSync(path.join(targetDir, file)).isDirectory(); }
                catch (e) { return false; }
            })
            .map(topicDir => {
                try {
                    const topicPath = path.join(targetDir, topicDir);
                    const angles = fs.readdirSync(topicPath)
                        .filter(file => file.endsWith('.md') || file.endsWith('.txt'))
                        .map(getStatusAndName)
                        .sort((a, b) => a.name.localeCompare(b.name));
                    let dateStr = 'Unknown', cleanTitle = topicDir;
                    const match = topicDir.match(/^([\d_-]+(?:AM|PM)?(?:-[A-Z]{3,4})?)_(.*)/);
                    if (match) {
                        dateStr = match[1].replace(/_/g, ' ').replace(/-/g, ':');
                        cleanTitle = match[2];
                    }
                    cleanTitle = cleanTitle.replace(/-/g, ' ').replace(/_/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    return { id: topicDir, date: dateStr, title: cleanTitle, angles, isArchived };
                } catch (e) { return null; }
            })
            .filter(t => t !== null)
            .sort((a, b) => b.id.localeCompare(a.id));
        return c.json(topics);
    } catch (err) { return c.json({ error: 'Failed to read directory' }, 500); }
});

app.get('/api/posts/:topic/:filename', (c) => {
    const { topic, filename } = c.req.param();
    let filePath = path.join(POSTS_DIR, topic, filename);
    if (!fs.existsSync(filePath)) filePath = path.join(ARCHIVE_DIR, topic, filename);
    if (!fs.existsSync(filePath)) return c.json({ error: 'Post not found' }, 404);
    const content = fs.readFileSync(filePath, 'utf-8');
    return c.json({ content });
});

app.put('/api/posts/:topic/:filename', async (c) => {
    const { topic, filename } = c.req.param();
    const { content } = await c.req.json();
    let filePath = path.join(POSTS_DIR, topic, filename);
    if (!fs.existsSync(filePath)) filePath = path.join(ARCHIVE_DIR, topic, filename);
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        return c.json({ success: true });
    } catch (err) { return c.json({ error: 'Failed to save post' }, 500); }
});

app.patch('/api/posts/:topic/:filename/status', async (c) => {
    const { topic, filename } = c.req.param();
    const { newStatus } = await c.req.json();
    let topicPath = path.join(POSTS_DIR, topic);
    if (!fs.existsSync(topicPath)) topicPath = path.join(ARCHIVE_DIR, topic);
    const oldPath = path.join(topicPath, filename);
    if (!fs.existsSync(oldPath)) return c.json({ error: 'Post not found' }, 404);
    const { name } = getStatusAndName(filename);
    const newFilename = `[${newStatus}]-${name}`;
    const newPath = path.join(topicPath, newFilename);
    try {
        fs.renameSync(oldPath, newPath);
        return c.json({ success: true, newFilename });
    } catch (err) { return c.json({ error: 'Failed to update status' }, 500); }
});

app.patch('/api/topics/:id/archived', async (c) => {
    const topicId = c.req.param('id');
    const { archived: shouldArchive } = await c.req.json();
    const sourceDir = shouldArchive ? POSTS_DIR : ARCHIVE_DIR;
    const destDir = shouldArchive ? ARCHIVE_DIR : POSTS_DIR;
    const sourcePath = path.join(sourceDir, topicId);
    const destPath = path.join(destDir, topicId);
    if (!fs.existsSync(sourcePath)) return c.json({ error: 'Topic not found' }, 404);
    try {
        fs.renameSync(sourcePath, destPath);
        return c.json({ success: true });
    } catch (err) { return c.json({ error: 'Failed to move topic' }, 500); }
});

app.get('/api/reports/:topicId', (c) => {
    const topicId = c.req.param('topicId');
    if (!fs.existsSync(REPORTS_DIR)) return c.json({ found: false, content: null });
    const reports = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.md'));
    const tsMatch = topicId.match(/^([\d]{4}-[\d]{2}-[\d]{2}_[\d]{2}-[\d]{2}-(?:AM|PM))/i);
    if (tsMatch) {
        const prefix = tsMatch[1];
        const match = reports.find(r => r.startsWith(prefix));
        if (match) return c.json({ found: true, filename: match, content: fs.readFileSync(path.join(REPORTS_DIR, match), 'utf-8') });
    }
    const compactMatch = topicId.match(/^([\d]{6,8}_[\d]{4})/);
    if (compactMatch) {
        const prefix = compactMatch[1];
        const match = reports.find(r => r.startsWith(prefix));
        if (match) return c.json({ found: true, filename: match, content: fs.readFileSync(path.join(REPORTS_DIR, match), 'utf-8') });
    }
    const slugFromTopic = topicId.replace(/^[\d]{4}-[\d]{2}-[\d]{2}[-_][\d]{2}-[\d]{2}-(?:AM|PM)[-_]?/i, '').replace(/^[\d]{6,8}_[\d]{4}[_-]?/, '').replace(/^[\d]{4}-[\d]{2}-[\d]{2}-[\d]{4}[_-]?/, '').toLowerCase();
    if (slugFromTopic) {
        const match = reports.find(r => r.toLowerCase().includes(slugFromTopic));
        if (match) return c.json({ found: true, filename: match, content: fs.readFileSync(path.join(REPORTS_DIR, match), 'utf-8') });
    }
    const dateMatch = topicId.match(/^([\d]{4}-[\d]{2}-[\d]{2})/);
    if (dateMatch) {
        const datePrefix = dateMatch[1];
        const dateMatches = reports.filter(r => r.startsWith(datePrefix));
        if (dateMatches.length > 0) {
            const match = dateMatches.sort().pop();
            return c.json({ found: true, filename: match, content: fs.readFileSync(path.join(REPORTS_DIR, match), 'utf-8') });
        }
    }
    return c.json({ found: false, content: null });
});

app.post('/api/copy', async (c) => {
    const { content } = await c.req.json();
    return new Promise((resolve) => {
        const proc = exec('xclip -selection clipboard', (err) => {
            if (err) resolve(c.json({ error: 'Clipboard error' }, 500));
            else resolve(c.json({ success: true }));
        });
        proc.stdin.write(content);
        proc.stdin.end();
    });
});

console.log(`🚀 Dashboard API running at http://localhost:${PORT}`);

export default {
    port: PORT,
    fetch: app.fetch,
};
