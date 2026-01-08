import { Request, Response } from 'express';
import { pool } from '../index';  // Importamos la conexión a la base de datos

export const getGoals = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Verificar si el usuario está autenticado
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
    }

    const result = await pool.query(
      'SELECT id, goal, description, current_value, unit, start_date, end_date FROM goals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [user.id]
    );

    // console.log('meta obtenida de la base de datos:', result.rows);

    return res.status(200).json(result.rows); // Enviamos solo la primera frase
  } catch (error) {
    console.error('Error al obtener las frases:', error);
    return res.status(500).json({
      errors: { server: 'Error al obtener las frases.' }
    });
  }
};
