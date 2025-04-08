const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// GET /api/projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).send('Server error');
  }
});

// POST /api/projects
app.post('/api/projects', async (req, res) => {
  try {
    const { name, location, description, start_date, end_date } = req.body;

    const result = await pool.query(
      `INSERT INTO projects (name, location, description, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, location, description, start_date, end_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting project:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/projects/:id/packages
app.get('/api/projects/:id/packages', async (req, res) => {
  const projectId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM construction_packages WHERE project_id = $1',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Greška pri učitavanju paketa:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:id/packages
app.post('/api/projects/:id/packages', async (req, res) => {
  const projectId = req.params.id;
  const { name, scope } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO construction_packages (project_id, name, scope)
       VALUES ($1, $2, $3) RETURNING *`,
      [projectId, name, scope]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri unosu paketa:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});