const express = require('express')
const path = require('path');
require('dotenv').config()

const app = express()
const port = process.env.PORT || 3000
// app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static("public"));

app.use('/api',require('./routes/api'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
})

app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/docs.html'));
})

// app.get('/track', (req, res) => {
//   res.render('track')
// })

// app.use('/order',require('./routes/order'))

app.listen(port, () => {
  console.log(`\x1b[33mBean app listening on port\x1b[34m ${port}\x1b[0m`)
})