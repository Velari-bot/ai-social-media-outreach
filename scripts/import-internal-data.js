const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

if (!admin.apps.length) {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountVar) {
        try {
            const serviceAccount = JSON.parse(serviceAccountVar);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT env var.');
        } catch (e) {
            console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env var:', e.message);
            process.exit(1);
        }
    } else {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '../service-account.json');
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            console.error("FIREBASE_SERVICE_ACCOUNT env var missing and service-account.json not found.");
            process.exit(1);
        }
    }
}

const db = admin.firestore();

function parseCsv(content) {
    const records = [];
    let currentRecord = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Double quote inside quotes - escaped quote
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRecord.push(currentField.trim());
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRecord.push(currentField.trim());
            if (currentRecord.length > 0 && currentRecord.some(f => f !== '')) {
                records.push(currentRecord);
            }
            currentRecord = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    // Add last field/record
    if (currentField || currentRecord.length > 0) {
        currentRecord.push(currentField.trim());
        records.push(currentRecord);
    }
    return records;
}

async function importFile(filePath) {
    console.log(`Importing ${filePath}...`);
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const rows = parseCsv(content);

    if (rows.length < 2) {
        console.log(`Skipping ${fileName}: No data rows found.`);
        return;
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    console.log(`Found ${dataRows.length} rows with headers: ${headers.join(', ')}`);

    const batchSize = 400;

    for (let i = 0; i < dataRows.length; i += batchSize) {
        const chunk = dataRows.slice(i, i + batchSize);
        const batch = db.batch();
        let chunkCount = 0;

        chunk.forEach((row, rowIndexInChunk) => {
            const absoluteRowIndex = i + rowIndexInChunk + 1; // +1 because we sliced headers

            // Skip rows that look like category headers (e.g. "BEAUTY CREATORS,,,,")
            const nonSnippetRows = row.filter(val => val && val.trim() !== '' && val.trim() !== '-');
            if (nonSnippetRows.length <= 1 && row[0] && row[0].toUpperCase() === row[0]) {
                return;
            }

            const data = {
                is_internal: true,
                source_file: fileName,
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            };

            // Map headers to common fields
            headers.forEach((header, index) => {
                let val = row[index];
                if (!val || val === '-' || val === '.') return;

                const h = header.toLowerCase().trim().replace(':', '');

                // Common mappings
                if (h === 'username' || h === 'handle' || h === 'prospect' || h === 'creator') {
                    if (!data.handle) data.handle = val;
                }
                if (h === 'email' || h === 'email address') {
                    if (!data.email) data.email = val;
                }
                if (h === 'name' || h === 'nickname') {
                    if (!data.name) data.name = val;
                }
                if (h === 'followers') data.followers = val;
                if (h === 'country' || h === 'region' || h === 'location') {
                    if (!data.region) data.region = val;
                }
                if (h === 'bio') data.bio = val;
                if (h === 'platform') data.platform = val;
                if (h === 'niche' || h === 'industry' || h === 'labels' || h === 'category') {
                    if (!data.niche) data.niche = val;
                }

                // Special handling for platform-specific columns
                if (val.includes('tiktok.com')) {
                    data.tiktok_url = val;
                    if (!data.platform) data.platform = 'TikTok';
                }
                if (val.includes('instagram.com')) {
                    data.instagram_url = val;
                    if (!data.platform) data.platform = 'Instagram';
                }
                if (val.includes('youtube.com')) {
                    data.youtube_url = val;
                    if (!data.platform) data.platform = 'YouTube';
                }

                // Store raw data too
                data[`raw_${header.replace(/[^a-zA-Z0-9]/g, '_')}`] = val;
            });

            // Default platform if not detected
            if (!data.platform) {
                if (fileName.toLowerCase().includes('tiktok')) data.platform = 'TikTok';
                else if (fileName.toLowerCase().includes('insta')) data.platform = 'Instagram';
                else data.platform = 'General';
            }

            // Clean handle
            if (data.handle && data.handle.includes(' (')) {
                data.handle = data.handle.split(' (')[0];
            }
            if (data.handle && data.handle.startsWith('http')) {
                // If handle is a URL, try to extract username
                try {
                    const parts = data.handle.split('/');
                    const lastPart = parts[parts.length - 1].split('?')[0];
                    if (lastPart.startsWith('@')) data.handle = lastPart;
                    else data.handle = '@' + lastPart;
                } catch (e) { }
            }

            // Fallback for handle if empty but name exists
            if (!data.handle && data.name) {
                data.handle = data.name.replace(/\s+/g, '').toLowerCase();
            }

            if (!data.handle && !data.email && !data.name) return; // Skip empty records

            // Use deterministic ID to avoid duplicates on re-runs
            const idSource = `${fileName}_${absoluteRowIndex}_${data.handle || data.email || 'row'}`;
            const docId = crypto.createHash('md5').update(idSource).digest('hex');

            const docRef = db.collection('internal_creators').doc(docId);

            // Add created_at only if it doesn't exist
            batch.set(docRef, {
                ...data,
                created_at: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            chunkCount++;
        });

        if (chunkCount > 0) {
            await batch.commit();
            console.log(`Committed batch. Progress: ${i + chunk.length}/${dataRows.length}`);
        }
    }

    console.log(`Finished importing ${fileName}`);
}

async function run() {
    const publicDir = path.join(__dirname, '../public');
    const files = fs.readdirSync(publicDir)
        .filter(f => f.endsWith('.csv'))
        .map(f => path.join('public', f));

    console.log(`Found ${files.length} CSV files to process.`);

    for (const file of files) {
        const fullPath = path.join(__dirname, '..', file);
        await importFile(fullPath);
    }

    console.log('All imports completed.');
    process.exit(0);
}

run().catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
});
