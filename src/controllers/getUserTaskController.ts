import { Request, Response } from 'express';
import { pool } from '../index';  // Importamos la conexión a la base de datos

export const getUserTasks = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Verificar si el usuario está autenticado
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
    }

    // Hacer la consulta para obtener todas las tareas que no estén archivadas (archived = false)
    let result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 AND archived = false ORDER BY created_at DESC',
      [user.id]
    );

    // Si no hay tareas, buscamos las más recientes sin importar el estado de archivado
    if (result.rows.length === 0) {
      console.log('No se encontraron tareas recientes. Buscando las tareas más recientes disponibles...');
      result = await pool.query(
        'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', // Limitamos a las 5 tareas más recientes
        [user.id]
      );
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener las tareas:', error);
    return res.status(500).json({
      errors: { general: 'Error del servidor, intenta de nuevo más tarde.' }
    });
  }
};
