export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth check
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { file } = req.query;
  const allowed = ['settings', 'packages', 'articles', 'results', 'faq'];
  if (!allowed.includes(file)) return res.status(400).json({ error: 'Invalid file' });

  try {
    const token = process.env.GITHUB_TOKEN;
    const repo = 'yusuf15emre-hue/yeni6';
    const path = `_data/${file}.json`;

    const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      }
    });

    const data = await r.json();
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    res.json({ content: JSON.parse(content), sha: data.sha });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
