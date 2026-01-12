import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes';  
import cron from 'node-cron';
import archiveOldTasks from './controllers/taskArchiver';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;

// Configuración de middleware
// app.use(cors());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://tasly.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

// Configuración de la conexión a la base de datos
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Verificar la conexión a la base de datos
const connectDB = async () => {
  try {
    await pool.connect();
    console.log('✅ Conexión exitosa a la base de datos');
  } catch (err) {
    console.error('❌ Error al conectar a la base de datos:', err);
    process.exit(1); // Finalizar la aplicación si hay un error crítico
  }
};

connectDB();

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Programamos el job para que se ejecute a las 00:00 horas del 7 de cada mes
let lastRunMonth: string | null = null; 

const runArchiveIfDay7 = async () => {
  // Hora Colombia 🇨🇴
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' })
  );

  const day = now.getDate(); // día del mes
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`; // ej: 2026-1

  // 👉 solo día 7
  if (day !== 7) return;

  // 👉 solo una vez por mes
  if (lastRunMonth === monthKey) {
    return;
  }

  console.log('Hoy es 7, ejecutando archivado...');
  await archiveOldTasks();

  lastRunMonth = monthKey;
};

// apenas arranca el server
runArchiveIfDay7();



// ---comentado para subir a vercel separado
// 📌 Servir archivos estáticos de frontend/dist
// app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// // 📌 Servir index.html en rutas desconocidas (para React/Vite)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
// });

// Iniciar el servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`🏠 Accede a la ruta principal en: http://localhost:${port}/Home`);
  console.log('🚀 Servidor backend corriendo en http://0.0.0.0:3000');
});
