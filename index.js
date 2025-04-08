const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// PostgreSQL konekcija
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'CM App',
  password: process.env.DB_PASSWORD, // koristiš .env fajl
  port: 5432,
});

// GET svi projekti
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects');
    res.json(result.rows);
  } catch (err) {
    console.error('Greška pri dohvatanju projekata:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST novi projekat
app.post('/api/projects', async (req, res) => {
  const { name, location, description, start_date, end_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO projects (name, location, description, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, location, description, start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri unosu projekta:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET svi paketi za projekat
app.get('/api/projects/:id/packages', async (req, res) => {
  const projectId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM construction_packages WHERE project_id = $1',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Greška pri dohvatanju paketa:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST novi paket za projekat
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

// GET svi izvođači za projekat
app.get('/api/projects/:id/contractors', async (req, res) => {
  const projectId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM contractors WHERE project_id = $1',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Greška pri dohvatanju izvođača:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST novi izvođač za projekat
app.post('/api/projects/:id/contractors', async (req, res) => {
  const projectId = req.params.id;
  const { name, contact_person, email, phone } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO contractors (project_id, name, contact_person, email, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [projectId, name, contact_person, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri unosu izvođača:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/packages/:id/assign-contractor
app.put('/api/packages/:id/assign-contractor', async (req, res) => {
  const packageId = req.params.id;
  const { contractor_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE construction_packages
       SET contractor_id = $1
       WHERE id = $2
       RETURNING *`,
      [contractor_id, packageId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri dodeli izvođača paketu:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});