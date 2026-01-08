import { pool } from '../index';  //conexion bd

// Esta función marcará como 'archived' las tareas más viejas de 7 días.
const archiveOldTasks = async () => {
  try {
    // Obtén la fecha actual y resta 7 días
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 5); // Restamos 7 días

    // Convertimos la fecha a formato YYYY-MM-DD
    const dateThreshold = currentDate.toISOString().split('T')[0];

    console.log(`Archivando tareas creadas antes del: ${dateThreshold}`);

    // Consulta a la base de datos para actualizar las tareas
    const result = await pool.query(
      'UPDATE tasks SET archived = true WHERE created_at <= $1 AND archived = false',
      [dateThreshold]
    );

    console.log(`Se archivaron ${result.rowCount} tareas.`);
  } catch (error) {
    console.error('Error al archivar tareas:', error);
  }
};

export default archiveOldTasks;
