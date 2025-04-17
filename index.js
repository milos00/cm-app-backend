const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const types = require('pg').types; // 👈 dodato

types.setTypeParser(1082, (val) => val); // 👈 rešenje: DATE → string

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// PostgreSQL konekcija
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'CM App',
  password: 'Elesilisa2324',
  port: 5432
});

// Pomocna funkcija za lokalno parsiranje datuma bez UTC pomeranja
const parseDate = (dateInput) => {
  if (!dateInput) throw new Error("⛔ Nedostaje datum za parsiranje");

  // Ako je Date objekat, prvo ga pretvori u string "YYYY-MM-DD"
  if (dateInput instanceof Date) {
    const iso = dateInput.toISOString().split('T')[0];
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Ako je već string (npr. "2025-04-15" ili "2025-04-15T00:00:00.000Z")
  const safeString = typeof dateInput === 'string' ? dateInput.split('T')[0] : '';
  const [year, month, day] = safeString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const calculateDuration = (startDate, endDate) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const diffTime = end - start;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const calculateEndDate = (startDate, duration) => {
  const [year, month, day] = startDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + Number(duration));
  return date.toISOString().split('T')[0];
};



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
    const { rows } = await pool.query(
      'SELECT * FROM activities WHERE project_id = $1',
      [projectId]
    );

const cleaned = rows.map((a) => ({
  ...a,
  start_date: typeof a.start_date === 'string'
    ? a.start_date
    : a.start_date?.toISOString().split('T')[0],
  end_date: typeof a.end_date === 'string'
    ? a.end_date
    : a.end_date?.toISOString().split('T')[0],
}));


    console.log('📦 Aktivnosti koje se šalju frontend-u:', cleaned);

    res.json(cleaned);
  } catch (err) {
    console.error('Greška pri dohvatanju aktivnosti:', err);
    res.status(500).send('Greška pri dohvatanju aktivnosti');
  }
});


app.post('/api/activities', async (req, res) => {
  try {
    const {
      project_id,
      name,
      start_date,
      end_date,
      duration,
      contractor_id,
      package_id
    } = req.body;

    // Formatiranje datuma u lokalni "YYYY-MM-DD"
    const cleanStart = typeof start_date === 'string' ? start_date.split('T')[0] : null;
    const cleanEnd = typeof end_date === 'string' ? end_date.split('T')[0] : null;

    // Konverzija praznih stringova u null
    const contractorId = contractor_id === '' ? null : contractor_id;
    const packageId = package_id === '' ? null : package_id;

    const { rows } = await pool.query(
      `INSERT INTO activities (
        project_id, name, start_date, end_date, duration,
        contractor_id, package_id, manual_start_date, manual_end_date, schedule_mode
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $3, $4, 'manual')
      RETURNING *`,
      [project_id, name, cleanStart, cleanEnd, duration, contractorId, packageId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Greška pri dodavanju aktivnosti:", err);
    res.status(500).send("Greška pri dodavanju aktivnosti");
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
  const { project_id, from_id, to_id, type, lag } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO activity_dependencies (project_id, from_id, to_id, type, lag)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [project_id, from_id, to_id, type, lag ?? 0]
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
  const { type, lag } = req.body;

  try {
    const result = await pool.query(
      `UPDATE activity_dependencies
       SET type = $1, lag = $2
       WHERE id = $3 RETURNING *`,
      [type, lag ?? 0, depId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Greška pri izmeni zavisnosti:', err);
    res.status(500).send('Greška pri izmeni zavisnosti');
  }
});


// === AUTO SCHEDULE RUTA ===
app.post('/api/projects/:id/auto-schedule', async (req, res) => {
  const projectId = req.params.id;
  console.log('▶ Auto Schedule pokrenut za projekat:', projectId);

  try {
    const { rows: activities } = await pool.query(
      'SELECT * FROM activities WHERE project_id = $1',
      [projectId]
    );

    const { rows: dependencies } = await pool.query(
      'SELECT * FROM activity_dependencies WHERE project_id = $1',
      [projectId]
    );

    console.log(`🔎 Učitano ${activities.length} aktivnosti i ${dependencies.length} zavisnosti`);

    const activityMap = new Map();
    const adjacency = new Map();
    const inDegree = new Map();

    for (const activity of activities) {
      activityMap.set(activity.id, { ...activity });
      adjacency.set(activity.id, []);
      inDegree.set(activity.id, 0);
    }

    for (const dep of dependencies) {
      adjacency.get(dep.from_id).push({
        to_id: dep.to_id,
        type: dep.type,
        lag: dep.lag || 0
      });
      inDegree.set(dep.to_id, inDegree.get(dep.to_id) + 1);
    }

    const queue = [];
    for (const [id, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(id);
    }

    console.log('🔁 Pokrećem topološko sortiranje...');
    while (queue.length > 0) {
      const currentId = queue.shift();
      const current = activityMap.get(currentId);
      const currentStart = parseDate(current.start_date);
      const currentEnd = parseDate(current.end_date);

      for (const dep of adjacency.get(currentId)) {
        const dependent = activityMap.get(dep.to_id);
        if (!dependent) continue;

        console.log(`⛓ ${dep.type} ${current.name} → ${dependent.name} (lag: ${dep.lag})`);

        // === FS (Finish-to-Start) ===
        if (dep.type === 'FS') {
          const proposedStart = new Date(currentEnd);
          proposedStart.setDate(proposedStart.getDate() + 1 + dep.lag);
          const proposedStartStr = proposedStart.toISOString().split('T')[0];
          const newEnd = calculateEndDate(proposedStartStr, dependent.duration);

          if (!dependent.start_date || parseDate(dependent.start_date).getTime() !== proposedStart.getTime()) {
            console.log(`📌 Ažuriram ${dependent.name}: FS start ${proposedStartStr} → ${newEnd}`);
            dependent.start_date = proposedStartStr;
            dependent.end_date = newEnd;
          }
        }

        // === SS (Start-to-Start) ===
        if (dep.type === 'SS') {
          const proposedStart = new Date(currentStart);
          proposedStart.setDate(proposedStart.getDate() + dep.lag);
          const proposedStartStr = proposedStart.toISOString().split('T')[0];
          const newEnd = calculateEndDate(proposedStartStr, dependent.duration);

          if (!dependent.start_date || parseDate(dependent.start_date).getTime() !== proposedStart.getTime()) {
            console.log(`📌 Ažuriram ${dependent.name}: SS start ${proposedStartStr} → ${newEnd}`);
            dependent.start_date = proposedStartStr;
            dependent.end_date = newEnd;
          }
        }

        // === FF (Finish-to-Finish) ===
        if (dep.type === 'FF') {
          const proposedEnd = new Date(currentEnd);
          proposedEnd.setDate(proposedEnd.getDate() + dep.lag);
          const proposedEndStr = proposedEnd.toISOString().split('T')[0];
          const proposedStart = new Date(proposedEnd);
          proposedStart.setDate(proposedEnd.getDate() - dependent.duration);
          const proposedStartStr = proposedStart.toISOString().split('T')[0];

          if (!dependent.end_date || parseDate(dependent.end_date).getTime() !== proposedEnd.getTime()) {
            console.log(`📌 Ažuriram ${dependent.name}: FF end ${proposedEndStr}`);
            dependent.start_date = proposedStartStr;
            dependent.end_date = proposedEndStr;
          }
        }

        inDegree.set(dep.to_id, inDegree.get(dep.to_id) - 1);
        if (inDegree.get(dep.to_id) === 0) {
          queue.push(dep.to_id);
        }
      }
    }

    // Ažuriranje baze
    for (const [id, updated] of activityMap.entries()) {
      if (!updated.start_date || !updated.end_date || updated.start_date === '' || updated.end_date === '') {
        console.log(`⚠️ Preskačem "${updated.name}" (id: ${id}) jer nema validne datume.`);
        continue;
      }

      const duration = calculateDuration(updated.start_date, updated.end_date);

      await pool.query(
        `UPDATE activities
         SET start_date = $1,
             end_date = $2,
             duration = $3,
             schedule_mode = 'auto'
         WHERE id = $4`,
        [updated.start_date, updated.end_date, duration, id]
      );
    }

    res.status(200).send('Auto Schedule završen uspešno.');
  } catch (err) {
    console.error('❌ Greška u auto schedule logici:', err);
    res.status(500).send('Greška prilikom izvršavanja Auto Schedule logike');
  }
});

// === MANUALLY SCHEDULE RUTA ===

app.post('/api/projects/:id/manual-schedule', async (req, res) => {
  const projectId = req.params.id;
  console.log('▶ Manual Schedule pokrenut za projekat:', projectId);

  try {
    const { rows: autoActivities } = await pool.query(
      `SELECT * FROM activities
       WHERE project_id = $1 AND schedule_mode = 'auto'`,
      [projectId]
    );

    for (const a of autoActivities) {
      if (!a.manual_start_date || !a.manual_end_date) {
        console.log(`⚠️ Preskačem aktivnost ${a.id} jer nema manuelne datume`);
        continue;
      }

      const duration = calculateDuration(a.manual_start_date, a.manual_end_date);

      await pool.query(
        `UPDATE activities
         SET start_date = $1,
             end_date = $2,
             duration = $3,
             schedule_mode = 'manual'
         WHERE id = $4`,
        [a.manual_start_date, a.manual_end_date, duration, a.id]
      );
    }
    res.status(200).send("Manual Schedule završen — aktivnosti vraćene na ručne vrednosti.");
  } catch (err) {
    console.error("Greška pri manual schedule:", err);
    res.status(500).send("Greška pri izvršavanju manual schedule logike");
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
    log_date,
    description,
    progress_percentage,
    supervisor_approved,
    supervisor_comment
  } = req.body;

  try {
    // Eksplicitno pretvori datum u "YYYY-MM-DD"
    const safeDate = typeof log_date === 'string'
      ? log_date.split('T')[0]
      : new Date(log_date).toISOString().split('T')[0];

    const result = await pool.query(
      `INSERT INTO daily_logs (activity_id, log_date, description, progress_percentage, supervisor_approved, supervisor_comment)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [activityId, safeDate, description, progress_percentage, supervisor_approved, supervisor_comment]
    );

    // Ažuriraj progress
    await pool.query(`
      UPDATE activities SET progress = sub.progress_percentage
      FROM (
        SELECT dl.activity_id, dl.progress_percentage
        FROM daily_logs dl
        WHERE dl.supervisor_approved = 'yes'
          AND dl.activity_id = $1
        ORDER BY dl.log_date DESC, dl.progress_percentage DESC
        LIMIT 1
      ) sub
      WHERE activities.id = sub.activity_id
    `, [activityId]);

    await pool.query(`
      UPDATE activities
      SET progress = NULL
      WHERE id = $1
      AND NOT EXISTS (
        SELECT 1 FROM daily_logs
        WHERE activity_id = $1 AND supervisor_approved = 'yes'
      )
    `, [activityId]);

    // Vraćanje odgovora sa tačnim formatom
    const insertedLog = result.rows[0];
    insertedLog.log_date = safeDate;
    res.status(201).json(insertedLog);

  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri unosu dnevnog loga');
  }
});




app.put('/api/daily-logs/:id', async (req, res) => {
  const logId = req.params.id;

  if (!logId || isNaN(parseInt(logId))) {
    return res.status(400).send('Neispravan ID loga');
  }

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

    await pool.query(`
      UPDATE activities SET progress = sub.progress_percentage
      FROM (
        SELECT dl.activity_id, dl.progress_percentage
        FROM daily_logs dl
        WHERE dl.supervisor_approved = 'yes'
          AND dl.activity_id = (SELECT activity_id FROM daily_logs WHERE id = $1)
        ORDER BY dl.log_date DESC, dl.progress_percentage DESC
        LIMIT 1
      ) sub
      WHERE activities.id = sub.activity_id
    `, [logId]);

    await pool.query(`
      UPDATE activities
      SET progress = NULL
      WHERE id = (
        SELECT activity_id FROM daily_logs WHERE id = $1
      ) AND NOT EXISTS (
        SELECT 1 FROM daily_logs
        WHERE activity_id = activities.id AND supervisor_approved = 'yes'
      )
    `, [logId]);

    const updatedLog = result.rows[0];
    updatedLog.log_date = updatedLog.log_date.toISOString().split('T')[0]; // <- ključna linija
    res.json(updatedLog);
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

    const deletedLog = result.rows[0];

    // 1. Ažuriraj progress ako još postoji neki validan log
    await pool.query(`
      UPDATE activities SET progress = sub.progress_percentage
      FROM (
        SELECT dl.activity_id, dl.progress_percentage
        FROM daily_logs dl
        WHERE dl.supervisor_approved = 'yes'
          AND dl.activity_id = $1
        ORDER BY dl.log_date DESC, dl.progress_percentage DESC
        LIMIT 1
      ) sub
      WHERE activities.id = sub.activity_id
    `, [deletedLog.activity_id]);

    // 2. Resetuj progress ako više nema nijednog odobrenog loga
    await pool.query(`
      UPDATE activities
      SET progress = NULL
      WHERE id = $1
      AND NOT EXISTS (
        SELECT 1 FROM daily_logs
        WHERE activity_id = $1 AND supervisor_approved = 'yes'
      )
    `, [deletedLog.activity_id]);

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
