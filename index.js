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
  password: process.env.DB_PASSWORD,
  port: 5432,
});

// --- Projekti ---

app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects');
    res.json(result.rows);
  } catch (err) {
    console.error('Greška pri dohvatanju projekata:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

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

// --- Construction Packages ---

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

// --- Contractors ---

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

// --- Activities ---

app.get('/api/projects/:id/activities', async (req, res) => {
  const projectId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM activities WHERE project_id = $1',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Greška pri dohvatanju aktivnosti:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/activities', async (req, res) => {
  const { project_id, package_id, contractor_id, name, start_date, end_date, duration } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO activities (project_id, package_id, contractor_id, name, start_date, end_date, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [project_id, package_id, contractor_id, name, start_date, end_date, duration]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri unosu aktivnosti:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/activities/:id', async (req, res) => {
  const activityId = req.params.id;
  const { name, start_date, end_date, duration, contractor_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE activities
       SET name = $1, start_date = $2, end_date = $3, duration = $4, contractor_id = $5
       WHERE id = $6
       RETURNING *`,
      [name, start_date, end_date, duration, contractor_id, activityId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri izmeni aktivnosti:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Activity Dependencies ---

app.post('/api/activities/:id/dependencies', async (req, res) => {
  const toId = req.params.id;
  const { from_id, type } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO activity_dependencies (from_id, to_id, type)
       VALUES ($1, $2, $3) RETURNING *`,
      [from_id, toId, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri dodavanju zavisnosti:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/activities/:id/dependencies', async (req, res) => {
  const toId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM activity_dependencies WHERE to_id = $1',
      [toId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Greška pri dohvatanju zavisnosti:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/activities/:id/dependencies/:depId', async (req, res) => {
  const depId = req.params.depId;
  try {
    await pool.query('DELETE FROM activity_dependencies WHERE id = $1', [depId]);
    res.status(204).send();
  } catch (err) {
    console.error('Greška pri brisanju zavisnosti:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});