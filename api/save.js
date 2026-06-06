export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { file, content, sha } = req.body;
  const allowed = ['settings', 'packages', 'articles', 'results', 'faq'];
  if (!allowed.includes(file)) return res.status(400).json({ error: 'Invalid file' });

  try {
    const token = process.env.GITHUB_TOKEN;
    const repo = 'yusuf15emre-hue/yeni6';
    const path = `_data/${file}.json`;
    const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update ${file} via admin panel`,
        content: encoded,
        sha,
      })
    });

    const data = await r.json();
    if (data.content) {
      res.json({ success: true, sha: data.content.sha });
    } else {
      res.status(400).json({ error: data.message });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
