export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing code parameter');
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).send(`GitHub OAuth error: ${data.error_description}`);
    }

    const token = data.access_token;
    const provider = 'github';

    // Send token back to Decap CMS via postMessage
    const html = `
<!DOCTYPE html>
<html>
<body>
<script>
  const receiveMessage = (e) => {
    window.opener.postMessage(
      'authorization:${provider}:success:${JSON.stringify({ token, provider })}',
      e.origin
    );
    window.removeEventListener('message', receiveMessage, false);
    setTimeout(() => window.close(), 1000);
  };
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:${provider}', '*');
</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (err) {
    res.status(500).send('Server error: ' + err.message);
  }
}
