import { Request, Response } from 'express';
import { pool } from '../index'; // Importamos la conexión a la base de datos

export const updateTaskStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Verificar si el usuario está autenticado
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
    }

    const taskId = req.headers['task-id']; 
    const status = req.headers['status'];

    // Validamos que el taskId y complete estén presentes
    if (!taskId || typeof status  !== 'string') {
      return res.status(400).json({
        errors: { 
          general: 'Datos inválidos.'
        }
      });
    }

     // validamos estados permitidos
    const allowedStatus = ['pending', 'in_progress', 'completed'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        errors: { general: 'Estado no válido.' }
      });
    }

    // 🔹 Verificar si la tarea ya está completada para no hacer nada
    const existingTask = await pool.query(
      'SELECT status FROM tasks WHERE id = $1',
      [taskId]
    );

    if (existingTask.rows[0].status === 'completed') {
      console.log('tarea ya completada');
      return res.status(400).json({ errors: { general: 'No se puede actualizar una tarea completada.' } });
    }

    // Realizamos la actualización en la base de datos
    const result = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, taskId]
    );

    // Si no se encuentra la tarea
    if (result.rows.length === 0) {
      return res.status(404).json({ errors: { general: 'Tarea no encontrada.' } });
    }

    // Respondemos con la tarea actualizada
    return res.status(200).json({ task: result.rows[0] });

  } catch (error) {
    console.error('Error al actualizar el estado de la tarea:', error);
    return res.status(500).json({
      errors: { server: 'Error al actualizar el estado de la tarea.' }
    });
  }
};
