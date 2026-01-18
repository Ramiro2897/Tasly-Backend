import { Request, Response } from 'express';
import { pool } from '../index';  
import { QueryResult } from 'pg'; 

export const updateTask = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 🔹 Verificar si el usuario está autenticado
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
    }

    const { updatedDate, updatedStartTime, updatedEndTime, updatedPriority, timeZone } = req.body;
    const taskId = Number(req.body.taskId);

    // 🔹 Validación de datos requeridos
    if (!taskId || !updatedDate || !updatedPriority) {
      return res.status(400).json({ errors: { errorUpdate: 'Faltan datos para actualizar la tarea.' } });
    }

    const formattedUpdatedDate = new Date(updatedDate).toISOString().split('T')[0];

    // 🔹 Fecha y hora actual según la zona del usuario
    const nowUser = new Date(new Date().toLocaleString('en-US', { timeZone: timeZone || 'UTC' }));
    console.log('⏱ nowUser:', nowUser.toISOString());

    const todayUserStr =
      nowUser.getFullYear() +
      '-' +
      String(nowUser.getMonth() + 1).padStart(2, "0") +
      '-' +
      String(nowUser.getDate()).padStart(2, "0");

    // 🔹 Validar que la fecha final no sea pasada
    if (updatedDate < todayUserStr) {
      return res.status(400).json({
        errors: { errorUpdate: 'La fecha final no puede ser anterior al día de hoy.' },
      });
    }

    // 🔹 Validación de horas: si uno existe y el otro no → error
    if ((updatedStartTime && !updatedEndTime) || (!updatedStartTime && updatedEndTime)) {
      return res.status(400).json({
        errors: { errorUpdate: 'Debes ingresar hora de inicio y hora de fin.' },
      });
    }

    // 🔹 Validación de coherencia: endTime > startTime
    if (updatedStartTime && updatedEndTime && updatedStartTime >= updatedEndTime) {
      return res.status(400).json({
        errors: { errorUpdate: 'La hora final debe ser mayor que la hora de inicio.' },
      });
    }

    // 🔹 Verificar si la tarea pertenece al usuario y si está completada
    const taskResult: QueryResult = await pool.query(
      'SELECT status FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, user.id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ errors: { errorUpdate: 'La tarea no pertenece al usuario.' } });
    }

    const taskStatus = taskResult.rows[0].status;

    if (taskStatus === 'completed') {
      return res.status(400).json({ errors: { errorUpdate: 'No puedes actualizar una tarea completada.' } });
    }

    // 🔹 Obtener la tarea original para validar horas y estado
    const originalTaskResult: QueryResult = await pool.query(
      'SELECT status, start_time, end_time FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, user.id]
    );

    const originalTask = originalTaskResult.rows[0];

    // 🔹 Validación de seguridad: si la tarea originalmente no tenía horas, no permitir actualizar horas
    if ((originalTask.start_time === null || originalTask.end_time === null) &&
        (updatedStartTime || updatedEndTime)) {
      return res.status(400).json({
        errors: { errorUpdate: 'No puedes agregar horas a una tarea que fue creada sin ellas.' },
      });
    }

    // 🔹 Para tareas en progreso, ignoramos completamente start_time
    let startTimeToUpdate: string | null = updatedStartTime || null;
    let endTimeToUpdate: string | null = updatedEndTime || null;

    // 🔹 Si la tarea está en progreso, ignoramos la hora de inicio
    if (originalTask.status === 'in_progress') {
      console.log('🔹 Tarea en progreso: se ignora la hora de inicio');
      startTimeToUpdate = originalTask.start_time; // nunca se cambia
    }

    const updateResult: QueryResult = await pool.query(
      'UPDATE tasks SET end_date = $1, start_time = $2, end_time = $3, priority = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND user_id = $6',
      [formattedUpdatedDate, startTimeToUpdate, endTimeToUpdate, updatedPriority, taskId, user.id]
    );


    if ((updateResult.rowCount ?? 0) > 0) {
      const updatedTaskResult: QueryResult = await pool.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
        [taskId, user.id]
      );
    
      const updatedTask = updatedTaskResult.rows[0];
      console.log('🔹 Tarea actualizada real:', updatedTask);
    
      return res.status(200).json({ task: updatedTask, message: 'Tarea actualizada correctamente.' });
    }

    return res.status(400).json({
      errors: { errorUpdate: 'No se pudo actualizar la tarea, verifica los datos.' }
    });

  } catch (error) {
    console.error('💥 Error al actualizar la tarea:', error);
    return res.status(500).json({
      errors: { errorUpdate: 'Error al actualizar la tarea.' }
    });
  }
};
