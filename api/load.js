import { checkAuth, ALLOWED, REPO } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await checkAuth(req, res))) return;

  const { file } = req.query;
  if (!ALLOWED.includes(file)) return res.status(400).json({ error: 'Invalid file' });

  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/_data/${file}.json`, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
    });
    if (!r.ok) throw new Error('github ' + r.status);
    const data = await r.json();
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    res.json({ content: JSON.parse(content), sha: data.sha });
  } catch (e) {
    console.error('load failed', e);
    res.status(500).json({ error: 'Could not load the file. Try again.' });
  }
}
