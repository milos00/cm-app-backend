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

app.get('/api/projects/:id', async (req, res) => {
  const projectId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Projekat nije pronađen');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri dohvatanju projekta:', err);
    res.status(500).send('Greška pri dohvatanju projekta');
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
  const { name, contact_person, email, phone, project_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO contractors (name, contact_person, email, phone, project_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, contact_person, email, phone, project_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri unosu izvođača');
  }
});


app.put('/api/contractors/:id', async (req, res) => {
  const contractorId = req.params.id;
  const { name, contact_person, email, phone } = req.body;
  try {
    const result = await pool.query(
      `UPDATE contractors SET name = $1, contact_person = $2, email = $3, phone = $4 WHERE id = $5 RETURNING *`,
      [name, contact_person, email, phone, contractorId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri izmeni izvođača:', err);
    res.status(500).send('Greška pri izmeni izvođača');
  }
});

app.delete('/api/contractors/:id', async (req, res) => {
  const contractorId = req.params.id;
  try {
    await pool.query('DELETE FROM contractors WHERE id = $1', [contractorId]);
    res.status(204).send();
  } catch (err) {
    console.error('Greška pri brisanju izvođača:', err);
    res.status(500).send('Greška pri brisanju izvođača');
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

app.put('/api/packages/:id', async (req, res) => {
  const packageId = req.params.id;
  const { name, scope } = req.body;

  try {
    const result = await pool.query(
      `UPDATE construction_packages SET name = $1, scope = $2 WHERE id = $3 RETURNING *`,
      [name, scope, packageId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri izmeni paketa:', err);
    res.status(500).send('Greška pri izmeni paketa');
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

app.put('/api/activities/:id', async (req, res) => {
  const activityId = req.params.id;
  const { name, start_date, end_date, duration, contractor_id, package_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE activities SET
         name = $1,
         start_date = $2,
         end_date = $3,
         duration = $4,
         contractor_id = $5,
         package_id = $6
       WHERE id = $7 RETURNING *`,
      [name, start_date, end_date, duration, contractor_id || null, package_id || null, activityId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri izmeni aktivnosti:', err);
    res.status(500).send('Greška pri izmeni aktivnosti');
  }
});

app.delete('/api/activities/:id', async (req, res) => {
  const activityId = req.params.id;
  try {
    await pool.query('DELETE FROM activity_dependencies WHERE to_id = $1 OR from_id = $1', [activityId]);
    await pool.query('DELETE FROM daily_logs WHERE activity_id = $1', [activityId]);
    await pool.query('DELETE FROM activities WHERE id = $1', [activityId]);
    res.status(204).send();
  } catch (err) {
    console.error('Greška pri brisanju aktivnosti:', err);
    res.status(500).send('Greška pri brisanju aktivnosti');
  }
});


// === ACTIVITY DEPENDENCIES ===

app.get('/api/projects/:id/dependencies', async (req, res) => {
  const projectId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT * FROM activity_dependencies WHERE project_id = $1`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Greška pri dohvatanju veza po projektu:', err);
    res.status(500).send('Greška pri dohvatanju zavisnosti');
  }
});


app.post('/api/dependencies', async (req, res) => {
  const { project_id, from_id, to_id, type } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO activity_dependencies (project_id, from_id, to_id, type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [project_id, from_id, to_id, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri dodavanju zavisnosti:', err);
    res.status(500).send('Greška pri dodavanju zavisnosti');
  }
});

app.delete('/api/dependencies/:id', async (req, res) => {
  const depId = req.params.id;
  try {
    await pool.query('DELETE FROM activity_dependencies WHERE id = $1', [depId]);
    res.status(204).send();
  } catch (err) {
    console.error('Greška pri brisanju veze:', err);
    res.status(500).send('Greška pri brisanju veze');
  }
});

app.put('/api/dependencies/:id', async (req, res) => {
  const depId = req.params.id;
  const { from_id, to_id, type } = req.body;

  try {
    const result = await pool.query(
      `UPDATE activity_dependencies
       SET from_id = $1, to_id = $2, type = $3
       WHERE id = $4 RETURNING *`,
      [from_id, to_id, type, depId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri izmeni zavisnosti:', err);
    res.status(500).send('Greška pri izmeni zavisnosti');
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
