const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const app = express();

// Azure ustawia port w zmiennej środowiskowej PORT
const port = process.env.PORT || 8080;

app.use(bodyParser.json());

const corsOptions = {
  origin: '*', // Umożliwienie dostępu z dowolnej domeny
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Pobierz wszystkie itemy
app.get('/items', async (req, res) => {
  try {
    const data = await fs.readFile('items.json');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
});

// Pobierz pojedynczy item
app.get('/items/:id', async (req, res) => {
  const itemId = parseInt(req.params.id);
  try {
    const data = await fs.readFile('items.json');
    const items = JSON.parse(data);
    const item = items.find(i => i.id === itemId);
    if (item) {
      res.json(item);
    } else {
      res.status(404).send('Item not found');
    }
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
});

// Pobierz itemy po właścicielu
app.get('/items/owner/:ownerId', async (req, res) => {
  const ownerId = parseInt(req.params.ownerId);
  try {
    const data = await fs.readFile('items.json');
    const items = JSON.parse(data);
    const ownerItems = items.filter(i => i.ownerId === ownerId);
    if (ownerItems.length > 0) {
      res.json(ownerItems);
    } else {
      res.status(404).send('Items not found');
    }
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
});

// Dodaj komentarz do itemu
app.post('/items/:id/comment', async (req, res) => {
  const itemId = parseInt(req.params.id);
  const newComment = req.body.comment;

  if (!newComment || typeof newComment.rating !== 'number') {
    return res.status(400).send('Invalid comment');
  }

  try {
    const data = await fs.readFile('items.json');
    const items = JSON.parse(data);
    const item = items.find(i => i.id === itemId);

    if (item) {
      item.comments.push(newComment);
      item.rating = calculateAverageRating(item.comments);
      await fs.writeFile('items.json', JSON.stringify(items, null, 2));
      res.status(200).send('Comment added');
    } else {
      res.status(404).send('Item not found');
    }
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
});

// Aktualizuj item
app.put('/items/:id', async (req, res) => {
  const itemId = parseInt(req.params.id);
  const updatedItem = req.body;

  try {
    const data = await fs.readFile('items.json');
    let items = JSON.parse(data);
    const itemIndex = items.findIndex(i => i.id === itemId);
    if (itemIndex > -1) {
      items[itemIndex] = updatedItem;
      await fs.writeFile('items.json', JSON.stringify(items, null, 2));
      res.status(200).send('Item updated');
    } else {
      res.status(404).send('Item not found');
    }
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
});

const calculateAverageRating = (comments) => {
  const totalRating = comments.reduce((sum, comment) => sum + comment.rating, 0);
  return comments.length ? totalRating / comments.length : 0;
};

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
