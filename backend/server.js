require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { seed } = require('./controllers/adminController');

let dbPromise;

async function initializeDB() {
  if (!dbPromise) {
    dbPromise = connectDB().then(() => seed());
  }

  return dbPromise;
}

if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  initializeDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Salon app running at http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

app.use(async (req, res, next) => {
  try {
    await initializeDB();
    next();
  } catch (error) {
    console.error('Database initialization failed:', error);
    next(error);
  }
});

module.exports = app;