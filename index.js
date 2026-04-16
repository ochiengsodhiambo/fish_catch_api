const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const config = {
  server: process.env.DATABASE_CONNECTION_STRING.split('Server=')[1].split(';')[0],
  database: process.env.DATABASE_CONNECTION_STRING.split('Initial Catalog=')[1].split(';')[0],
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DATABASE_CONNECTION_STRING.split('User ID=')[1].split(';')[0],
      password: process.env.DATABASE_CONNECTION_STRING.split('Password=')[1].split(';')[0]
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectTimeout: 120000,
    requestTimeout: 120000
  }
};

let pool;

async function initDb() {
  try {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('Connected to MSSQL');
  } catch (err) {
    console.error('DB connection failed:', err);
    process.exit(1);
  }
}

// REST endpoint
app.get('/api/BHApiEndpoint', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM dbo.fish_catch_view');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/BHApiEndpoint/:id', async (req, res) => {
  try {
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM dbo.fish_catch_view WHERE f_stock_id = @id');
    res.json(result.recordset[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
});