// import express from 'express';
import express, { Request, Response } from 'express';
import { register } from '../controllers/registerController';
import { login } from '../controllers/authController';
import { verifyToken } from '../middleware/verifyToken';
import { createTask } from '../controllers/taskController';
import { createPhrase } from '../controllers/phrasesController';
import { createGoal } from '../controllers/goalController';
import { getTasks, getDailyTasksSummary } from '../controllers/getTaskController';
import { getPhrases } from '../controllers/getPhrasesController';
import { getGoals } from '../controllers/getGoalsController';
import { getUserTasks } from '../controllers/getUserTaskController';
import { searchTasks } from '../controllers/searchTasks';
import { updateTaskStatus } from '../controllers/updateTaskStatus';
import { deleteTask } from '../controllers/deleteTask';
import { deleteGoal } from '../controllers/deleteGoal';
import { updateTask } from '../controllers/updateTask';
import { searchPhrases } from '../controllers/searchPhrases';
import { searchGoals } from '../controllers/searchGoals';
import { getUserPhrases } from '../controllers/getUserPhrasesController';
import { getUserGoals } from '../controllers/getUserGoalsController';
import { deletePhrase } from '../controllers/deletePhrase';
import { updatePhrase } from '../controllers/updatePhrase';
import { updateGoal, advanceGoal } from '../controllers/updateGoal';
import { updatePhraseFavorite } from '../controllers/updatePhraseFavorite';
import { logout } from '../controllers/logout';


const router = express.Router();

// Ruta para el registro de usuarios
router.post('/register', async (req, res) => {
  await register(req, res);
});

// Ruta para el inicio de sesión
router.post('/login', async (req, res) => {
  await login(req, res);
});

// ruta para cerrar sesion
router.post('/logout', verifyToken, async (req, res) => {
  console.log('cierra sesion')
  await logout(req, res)
});

// Ruta para la creación de tareas (se añade dentro de authRoutes)
router.post('/task', verifyToken, async (req, res) => {
  console.log('paso por aqui');
  await createTask(req, res); 
});

// Ruta para la creación de tareas (se añade dentro de authRoutes)
router.post('/phrase', verifyToken, async (req, res) => {
  console.log('entro aqui al crear la frase');
  await createPhrase(req, res);
});

// ruta para la creacion de metas...
router.post('/goals', verifyToken, async (req, res) => {
  console.log('entro aqui al crear una meta');
  await createGoal(req, res);
  // await createPhrase(req, res);
});

// ruta para hacer la consulta de la ultima tarea de dicho usuario
router.get('/tasklist', verifyToken, async (req, res) => {
  // console.log('entro aqui al hacer la consulta de las tareas...');
  await getTasks(req, res); 
});

// ruta para hacer la consulta de la longitud de tareas 
router.get('/tasklistAll', verifyToken, async (req, res) => {
  // console.log('entro aqui al hacer la consulta de las tareas...');
  await getDailyTasksSummary(req, res); 
});

// ruta para hacer la consulta a las tareas de dicho usuario
router.get('/phraseslist', verifyToken, async (req, res) => {
  // console.log('entro aqui al hacer la consulta de las frases...');
  await getPhrases(req, res); 
});

// ruta para hacer la consulta a las metas de dicho usuario
router.get('/goallist', verifyToken, async (req, res) => {
  // console.log('entro aqui al hacer la consulta de las Metas...');
  await getGoals(req, res); 
});

// ruta para hacer la consulta a las tereas de dicho usuario que se muestran en el componente
router.get('/loadTasks', verifyToken, async (req, res) => {
  await getUserTasks(req, res);
});

// ruta para hacer la busqueda de tareas de cierto usuario
router.get('/searchTasks', verifyToken, async (req, res) => {
  await searchTasks(req, res); 
});

// Ruta para actualizar el estado de la tarea (completa o pendiente)
router.put('/updateTask', verifyToken, async (req, res) => {
  await updateTaskStatus(req, res); 
});

// Ruta para eliminar una tarea
router.delete('/deleteTask', verifyToken, async (req, res) => {
  // console.log('entra aquiiiiii');
  await deleteTask(req, res); 
});

// Ruta para eliminar una meta
router.delete('/deleteGoal', verifyToken, async (req, res) => {
  await deleteGoal(req, res); 
});

// ruta para actualizar una tarea
router.put('/taskUpdate', verifyToken, async (req, res) => {
  console.log('entra aquiiiiii');
  await updateTask(req, res);
});

// ruta para hacer la busqueda de frases de cierto usuario
router.get('/searchPhrases', verifyToken, async (req, res) => {
  await searchPhrases(req, res); 
});

// ruta para hacer la busqueda de metas de cierto usuario
router.get('/searchGoals', verifyToken, async (req, res) => {
  await searchGoals(req, res); 
});

// ruta para hacer la consulta a las frases de dicho usuario que se muestran en el componente
router.get('/loadPhrases', verifyToken, async (req, res) => {
  await getUserPhrases(req, res);
});

// ruta para hacer la consulta a las metas de dicho usuario que se muestran en el componente
router.get('/loadGoals', verifyToken, async (req, res) => {
  await getUserGoals(req, res);
});

// Ruta para eliminar una frase
router.delete('/deletePhrase', verifyToken, async (req, res) => {
  console.log('eliminando frase');
  await deletePhrase(req, res); 
});

// ruta para actualizar una tarea
router.put('/phraseUpdate', verifyToken, async (req, res) => {
  console.log('entra al actualizar frase');
  await updatePhrase(req, res);
});

// ruta para agregar nota en una meta
router.put('/goalUpdate', verifyToken, async (req, res) => {
  // console.log('entra al agregar nota meta');
  await updateGoal(req, res); 
});

// ruta para agregar actualizar el avance de la meta
router.put('/goalAdvance', verifyToken, async (req, res) => {
  await advanceGoal(req, res); 
});

// Ruta para actualizar el estado de la frase (favorita)
router.put('/updateFavorite', verifyToken, async (req, res) => {
  await updatePhraseFavorite(req, res); 
});

export default router;



