const express = require('express')
const path = require('path');
require('dotenv').config()

const app = express()
const port = process.env.PORT || 3000
app.use(express.json());
app.use(express.static("public"));

app.use('/api', require('./routes/api'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
})

app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/docs.html'));
})

app.get('/track', (req, res) => {
  const { orderid } = req.query
  if (orderid) {
    res.sendFile(path.join(__dirname, '/public/track.html'));
  } else {
    res.sendFile(path.join(__dirname, '/public/track-empty.html'));
  }
})

app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/order.html'));
})

app.listen(port, () => {
  console.log(`\x1b[33mBean app listening on port\x1b[34m ${port}\x1b[0m`)
})