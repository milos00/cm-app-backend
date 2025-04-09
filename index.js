const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// PostgreSQL konekcija
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'CM App',
  password: 'Elesilisa2324', // zameni sa svojom lozinkom
  port: 5432
});

// === PROJECTS ===

app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri dohvatanju projekata');
  }
});

app.post('/api/projects', async (req, res) => {
  const { name, location, description, start_date, end_date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO projects (name, location, description, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, location, description, start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri unosu projekta');
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  const projectId = req.params.id;
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    res.status(204).send();
  } catch (err) {
    console.error('Greška pri brisanju projekta:', err);
    res.status(500).send('Greška pri brisanju projekta');
  }
});

app.put('/api/projects/:id', async (req, res) => {
  const projectId = req.params.id;
  const { name, location, description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE projects SET name = $1, location = $2, description = $3 WHERE id = $4 RETURNING *`,
      [name, location, description, projectId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri izmeni projekta:', err);
    res.status(500).send('Greška pri izmeni projekta');
  }
});



// === CONTRACTORS ===

app.get('/api/projects/:id/contractors', async (req, res) => {
  const projectId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM contractors WHERE project_id = $1',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Greška pri dohvatanju izvođača po projektu:', err);
    res.status(500).send('Greška pri dohvatanju izvođača');
  }
});

app.post('/api/contractors', async (req, res) => {
  const { name, contact_person, email, phone } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO contractors (name, contact_person, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, contact_person, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri unosu izvođača');
  }
});

// === PACKAGES ===

app.get('/api/projects/:id/packages', async (req, res) => {
  const projectId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM construction_packages WHERE project_id = $1',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri dohvatanju paketa');
  }
});

app.post('/api/projects/:id/packages', async (req, res) => {
  const projectId = req.params.id;
  const { name, description, scope } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO construction_packages (project_id, name, description, scope) VALUES ($1, $2, $3, $4) RETURNING *',
      [projectId, name, description, scope]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri unosu paketa');
  }
});

app.put('/api/packages/:id/assign-contractor', async (req, res) => {
  const { contractor_id } = req.body;
  const packageId = req.params.id;
  try {
    const result = await pool.query(
      'UPDATE construction_packages SET contractor_id = $1 WHERE id = $2 RETURNING *',
      [contractor_id, packageId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri dodeli izvođača');
  }
});

app.delete('/api/packages/:id', async (req, res) => {
  const packageId = req.params.id;
  try {
    // Ako imaš FK ka activities, moraš prvo obrisati sve aktivnosti iz paketa
    await pool.query('DELETE FROM activities WHERE package_id = $1', [packageId]);
    await pool.query('DELETE FROM construction_packages WHERE id = $1', [packageId]);
    res.status(204).send();
  } catch (err) {
    console.error('Greška pri brisanju paketa:', err);
    res.status(500).send('Greška pri brisanju paketa');
  }
});


// === ACTIVITIES ===

app.get('/api/projects/:id/activities', async (req, res) => {
  const projectId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM activities WHERE project_id = $1 ORDER BY start_date',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri dohvatanju aktivnosti');
  }
});

app.post('/api/activities', async (req, res) => {
  const {
    project_id,
    package_id,
    contractor_id,
    name,
    start_date,
    end_date,
    duration
  } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO activities (project_id, package_id, contractor_id, name, start_date, end_date, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [project_id, package_id, contractor_id, name, start_date, end_date, duration]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri unosu aktivnosti');
  }
});

// === ACTIVITY DEPENDENCIES ===

app.get('/api/activities/:id/dependencies', async (req, res) => {
  const activityId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM activity_dependencies WHERE to_id = $1',
      [activityId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri dohvatanju veza aktivnosti');
  }
});

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
    console.error(err);
    res.status(500).send('Greška pri dodavanju veze');
  }
});

app.delete('/api/activities/:id/dependencies/:depId', async (req, res) => {
  const depId = req.params.depId;
  try {
    await pool.query('DELETE FROM activity_dependencies WHERE id = $1', [depId]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri brisanju veze');
  }
});

// === DAILY LOGS ===

app.get('/api/activities/:id/daily-logs', async (req, res) => {
  const activityId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT * FROM daily_logs WHERE activity_id = $1 ORDER BY log_date DESC`,
      [activityId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri dohvatanju dnevnih logova');
  }
});

app.post('/api/activities/:id/daily-logs', async (req, res) => {
  const activityId = req.params.id;
  const {
    description,
    progress_percentage,
    supervisor_approved,
    supervisor_comment
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO daily_logs (activity_id, log_date, description, progress_percentage, supervisor_approved, supervisor_comment)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5) RETURNING *`,
      [activityId, description, progress_percentage, supervisor_approved, supervisor_comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri unosu dnevnog loga');
  }
});

app.put('/api/daily-logs/:id', async (req, res) => {
  const logId = req.params.id;
  const { progress_percentage, supervisor_approved, supervisor_comment } = req.body;

  try {
    const result = await pool.query(
      `UPDATE daily_logs SET
        progress_percentage = $1,
        supervisor_approved = $2,
        supervisor_comment = $3
       WHERE id = $4 RETURNING *`,
      [progress_percentage, supervisor_approved, supervisor_comment, logId]
    );
    if (result.rowCount === 0) {
      return res.status(404).send('Log nije pronađen');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri ažuriranju dnevnog loga');
  }
});

app.delete('/api/daily-logs/:id', async (req, res) => {
  const logId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM daily_logs WHERE id = $1 RETURNING *', [logId]);
    if (result.rowCount === 0) {
      return res.status(404).send('Log nije pronađen');
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri brisanju dnevnog loga');
  }
});

// === SERVER START ===

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
