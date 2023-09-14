const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors'); // Import the cors package
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());


// Create and connect to the SQLite database
const db = new sqlite3.Database('notes.db');

// Middleware for JWT authentication
function authenticateToken(req, res, next) {
  /*const token = req.header('Authorization');
  if (!token) return res.status(401).send('Access denied.');

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) return res.status(403).send('Invalid token.');
    req.user = user;
    next();
  });
  */
  next();
}

// Create a table for notes in SQLite
db.serialize(() => {
  db.run(
    'CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, title TEXT, content TEXT)'
  );
});

// Routes for CRUD operations
app.post('/api/notes', authenticateToken, (req, res) => {
  // Create a new note
  const { title, content } = req.body;
  const stmt = db.prepare('INSERT INTO notes (title, content) VALUES (?, ?)');
  stmt.run(title, content, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    res.status(201).json({ message: 'Note created successfully' });
  });
  stmt.finalize();
});

app.get('/api/notes', authenticateToken, (req, res) => {
  // Retrieve all notes
  db.all('SELECT * FROM notes', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/notes/:id', authenticateToken, (req, res) => {
  // Retrieve a specific note by ID
  const id = req.params.id;
  db.get('SELECT * FROM notes WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'Note not found' });
    res.json(row);
  });
});

app.put('/api/notes/:id', authenticateToken, (req, res) => {
  // Update a specific note by ID
  const { title, content } = req.body;
  const id = req.params.id;
  db.run('UPDATE notes SET title = ?, content = ? WHERE id = ?', [title, content, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Note updated successfully' });
  });
});

app.delete('/api/notes/:id', authenticateToken, (req, res) => {
  // Delete a specific note by ID
  const id = req.params.id;
  db.run('DELETE FROM notes WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Note deleted successfully' });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
