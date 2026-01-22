import { Request, Response } from 'express';
import { pool } from '../index';
import { QueryResult } from 'pg';

export const autoStartTask = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {

    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const { taskId } = req.body;
    if (!taskId) {
      return res.status(400).json({ message: 'taskId requerido' });
    }

    // 🔹 Verificar tarea
    const taskResult: QueryResult = await pool.query(
      `
      SELECT id, status
      FROM tasks
      WHERE id = $1 AND user_id = $2
      `,
      [taskId, user.id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const task = taskResult.rows[0];
    console.log('Estado actual de la tarea:', task.status);

    if (task.status !== 'pending') {
      return res.status(200).json({ message: 'La tarea ya fue procesada' });
    }


    // 🔹 Update atómico
    const updateResult: QueryResult = await pool.query(
      `
      UPDATE tasks
      SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 AND status = 'pending'
      RETURNING *
      `,
      [taskId, user.id]
    );


    if (updateResult.rows.length === 0) {
      console.log('UPDATE no afectó filas');
      return res.status(200).json({ message: 'No se actualizó la tarea' });
    }

    return res.status(200).json({
      task: updateResult.rows[0],
    });

  } catch (error) {
    console.error('Error auto-start task:', error);
    return res.status(500).json({
      message: 'Error al auto iniciar la tarea',
    });
  }
};

