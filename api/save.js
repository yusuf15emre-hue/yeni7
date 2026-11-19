import { checkAuth, ALLOWED, REPO } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await checkAuth(req, res))) return;

  const { file, content, sha } = req.body || {};
  if (!ALLOWED.includes(file)) return res.status(400).json({ error: 'Invalid file' });
  if (content === undefined || typeof sha !== 'string') return res.status(400).json({ error: 'Invalid request' });

  try {
    const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/_data/${file}.json`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: `Update ${file} via admin panel`, content: encoded, sha })
    });
    const data = await r.json();
    if (r.ok && data.content) return res.json({ success: true, sha: data.content.sha });
    console.error('save failed', r.status, data.message);
    res.status(409).json({ error: 'Could not save. Reload the panel and try again.' });
  } catch (e) {
    console.error('save failed', e);
    res.status(500).json({ error: 'Could not save. Try again.' });
  }
}
