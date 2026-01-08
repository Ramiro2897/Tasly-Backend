import { Request, Response } from 'express';
import { pool } from '../index';  // Importamos la conexión a la base de datos

export const searchGoals = async (req: Request, res: Response): Promise<Response> => {
  try {
     // Verificar si el usuario está autenticado
     const user = (req as any).user;
     if (!user) {
       return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
     }
 
    const query = req.query.query; // Extraemos el término de búsqueda desde los query parameters

    console.log('usuario id:', user.id, 'query:', query);

    // Validamos si la cadena de búsqueda está vacía o contiene solo espacios en blanco
    if (typeof query === 'string' && query.trim() === "") {
      return res.status(400).json({
        errors: { general: 'No se encontraron metas.' },
      });
    }

    // Hacer la consulta para buscar las tareas que coincidan con el término de búsqueda
    const result = await pool.query(
      'SELECT * FROM goals WHERE user_id = $1 AND goal ILIKE $2 ORDER BY created_at DESC',
      [user.id, `%${query}%`]
    );

    if (result.rows.length === 0) {
      console.log('no hay metas');
      return res.status(404).json({
        errors: { general: 'No se encontraron metas.' }
      });
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al buscar metas:', error);
    return res.status(500).json({
      errors: { general: 'Error del servidor, intenta de nuevo más tarde.' }
    });
  }
};
