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
    const complete = req.headers['complete'];
    const completeBool = complete === 'true'; // Esto convertirá "true" a true, y "false" a false
    // console.log('actualizar', taskId, completeBool);

    // Validamos que el taskId y complete estén presentes
    if (!taskId || typeof completeBool  !== 'boolean') {
      return res.status(400).json({
        errors: { 
          general: 'Error inesperado.'
        }
      });
    }

    // Realizamos la actualización en la base de datos
    const result = await pool.query(
      'UPDATE tasks SET complete = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [completeBool, taskId]
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
