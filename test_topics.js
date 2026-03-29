const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, 'content/posts');

const getStatusAndName = (filename) => {
    const match = filename.match(/^\[(DRAFT|READY|PUBLISHED|SKIPPED|ARCHIVED)\]-(.*)/);
    if (match) {
        return { status: match[1], name: match[2], raw: filename };
    }
    const oldSkipMatch = filename.match(/^\[skipped\]-(.*)/);
    if (oldSkipMatch) return { status: 'SKIPPED', name: oldSkipMatch[1], raw: filename };
    
    return { status: 'DRAFT', name: filename, raw: filename };
};

try {
    const topics = fs.readdirSync(POSTS_DIR)
        .filter(file => {
            try {
                return fs.statSync(path.join(POSTS_DIR, file)).isDirectory();
            } catch (e) {
                console.error(`Failed to stat file: ${file}`, e.message);
                return false;
            }
        })
        .map(topicDir => {
            try {
                const topicPath = path.join(POSTS_DIR, topicDir);
                const angles = fs.readdirSync(topicPath)
                    .filter(file => file.endsWith('.md') || file.endsWith('.txt'))
                    .map(getStatusAndName)
                    .sort((a, b) => a.name.localeCompare(b.name));
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
                    angles: angles
                };

            } catch (e) {
                console.error(`Error processing topic directory: ${topicDir}`, e.message);
                return null;
            }
        })
        .filter(t => t !== null)
        .sort((a, b) => b.id.localeCompare(a.id));

    console.log(JSON.stringify(topics, null, 2));
} catch (err) {
    console.error('Failed to fetch topics', err.message);
}
