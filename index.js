const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Parse connection string properly
function parseConnectionString(connStr) {
  const parts = {};
  connStr.split(';').forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) {
      parts[key.trim()] = value.trim();
    }
  });
  return parts;
}

const connParts = parseConnectionString(process.env.DATABASE_CONNECTION_STRING);
const server = connParts['Server'].replace('tcp:', '').split(',')[0];
const port = connParts['Server'].includes(',') ? parseInt(connParts['Server'].split(',')[1]) : 1433;

const config = {
  server: server,
  port: port,
  database: connParts['Initial Catalog'],
  authentication: {
    type: 'default',
    options: {
      userName: connParts['User ID'],
      password: connParts['Password']
    }
  },
  options: {
    encrypt: connParts['Encrypt'] === 'True',
    trustServerCertificate: connParts['TrustServerCertificate'] === 'True',
    connectTimeout: parseInt(connParts['Connection Timeout']) * 1000 || 120000,
    requestTimeout: parseInt(connParts['Command Timeout']) * 1000 || 120000
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
      .input('id', sql.VarChar, req.params.id)  // Changed from sql.Int to sql.VarChar
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