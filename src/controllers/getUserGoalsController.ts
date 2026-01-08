import { Request, Response } from 'express';
import { pool } from '../index';  

export const getUserGoals = async (req: Request, res: Response): Promise<Response> => {
  try {

    // Verificar si el usuario está autenticado
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
    }

    // console.log('userId de las metas a consultar para el usuario:', user.id);

    // Hacer la consulta para obtener todas las tareas que no estén archivadas (archived = false)
    let result = await pool.query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );

    // Si no hay frases
    if (result.rows.length === 0) {
      return res.status(404).json({
        errors: { message: 'No se encontraron metas.' }
      });
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener las metas:', error);
    return res.status(500).json({
      errors: { general: 'Error del servidor, intenta de nuevo más tarde.' }
    });
  }
};
