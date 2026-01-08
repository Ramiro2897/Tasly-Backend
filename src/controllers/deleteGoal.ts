import { Request, Response } from 'express';
import { pool } from '../index'; // Importamos la conexión a la base de datos

export const deleteGoal = async (req: Request, res: Response): Promise<Response> => {
  try {
     // Verificar si el usuario está autenticado
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
    }

    const goalId = Number(req.headers['goal-id']);
    // console.log('datos al eliminar una meta', goalId, user.id);

    // Validamos que el taskId y userId estén presentes
    if (!goalId) {
      return res.status(400).json({
        errors: { general: 'Fallo en el usuario.' }
      });
    }

    // Verificamos que la tarea pertenezca al usuario antes de eliminarla
    const taskResult = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
      [goalId, user.id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ errors: { general: 'Meta no encontrada o no pertenece al usuario.' } });
    }

    // Eliminamos la tarea
    await pool.query('DELETE FROM goals WHERE id = $1', [goalId]);

    // Respondemos con un mensaje de éxito
    return res.status(200).json({ message: 'Meta eliminada correctamente.' });

  } catch (error) {
    console.error('Error al eliminar la meta:', error);
    return res.status(500).json({
      errors: { server: 'Error al eliminar la meta.' }
    });
  }
};