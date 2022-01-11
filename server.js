const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { extract, setSanitizeHtmlOptions } = require('article-parser');
setSanitizeHtmlOptions({
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5',
    'u', 'b', 'i', 'em', 'strong', 'small', 'sup', 'sub',
    'div', 'span', 'p', 'article', 'blockquote', 'section',
    'details', 'summary',
    'pre', 'code',
    'ul', 'ol', 'li', 'dd', 'dl',
    // 'table', 'th', 'tr', 'td', 'thead', 'tbody', 'tfood',
    // 'fieldset', 'legend',
    // 'figure', 'figcaption', 'img', 'picture',
    // 'video', 'audio', 'source',
    // 'iframe',
    // 'progress',
    // 'br', 'p', 'hr',
    // 'label',
    // 'abbr',
    // 'a',
    // 'svg'
  ],
})

const app = express();
const port = process.env.PORT || 5000;

// app.use(bodyParser.json({ limit: '100mb', extended: true }));
app.use(bodyParser.json({ parameterLimit: 1000000, limit: '100mb', extended: true }));

// API calls
app.get('/api/hello', (req, res) => {
  res.send({ express: 'Hello From Express' });
});

app.post('/api/world', async function (req, res) {
  let channel = req.body.post

  const linkBlocks = channel.contents.filter((block) => block.class === "Link")

  const extractedArticles = linkBlocks.map(async (block) => {
    const article = await extract(block.source.url)
    return article;
  })

  const articles = await Promise.all(extractedArticles)

  for (let i = 0; i < channel.contents.length; i++) {
    for (let l = 0; l < articles.length; l++) {
      if (channel.contents[i].class === "Link" && articles[l] !== null && channel.contents[i].source.url === articles[l].url) {
        channel.contents[i].class = "Text"
        channel.contents[i].content_html = articles[l].content
        channel.contents[i].source = null
        channel.contents[i].image = ""
      }
    }
  }

  res.send(
    channel,
  );
});

if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, 'client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.listen(port, () => console.log(`Listening on port ${port}`));