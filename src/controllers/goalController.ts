import { Request, Response } from 'express';
import { pool } from '../index';  // Importa la conexión desde index.ts

export const createGoal = async (req: Request, res: Response): Promise<Response> => {
  // Verificar si el usuario está autenticado
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
  }

  const { goal, description, startDate, endDate, unit} = req.body;
  console.log('Datos recibidos:', req.body);

  // ----------------------------
  // Obtener la fecha actual en formato YYYY-MM-DD en la zona horaria de Colombia
  const today = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).split('/').reverse().join('-'); // YYYY-MM-DD
  // ----------------------------

  if (!goal || goal.trim() === '') {
    console.log('Error: El nombre de la meta está vacío');
    return res.status(400).json({
      errors: { goal: 'El nombre de la meta no puede estar vacío.' }
    });
  }

  if (goal.length > 35) {
    console.log('Error: El nombre de la meta no puede superar los 35 caracteres');
    return res.status(400).json({
      errors: { goal: 'Nombre de la meta extenso.' }
    });
  }

  if (description.length > 200) {
    console.log('Error: La descripción no puede superar los 200 caracteres');
    return res.status(400).json({
      errors: { description: 'La descripción es muy extensa.' }
    });
  }

  if (!startDate || !endDate) {
    console.log('Error: Fechas incompletas', startDate, endDate);
    return res.status(400).json({ errors: { date: 'Las fechas de inicio y fin son obligatorias.' } });
  }

  // ----------------------------
  // ✅ NUEVO: comparaciones directas de strings YYYY-MM-DD
  // Esto evita problemas de timezone en prod
  if (startDate < today) {
    console.log('Error: Fecha de inicio en el pasado:', startDate);
    return res.status(400).json({ errors: { date: 'La fecha de inicio no puede ser en el pasado.' } });
  }

  if (endDate < startDate) {
    console.log('Error: Fecha de fin menor a la de inicio:', endDate, startDate);
    return res.status(400).json({ errors: { date: 'Fecha final menor que la de inicio.' } });
  }

  // Calcular la fecha mínima de finalización (3 meses después de la fecha de inicio)
  // Aquí sí usamos Date porque necesitamos sumar meses
  const minEndDate = new Date(startDate); 
  minEndDate.setMonth(minEndDate.getMonth() + 3);

  // Convertir minEndDate a YYYY-MM-DD para comparación con endDate
  const minEndDateStr = minEndDate.toISOString().split('T')[0];

  if (endDate < minEndDateStr) {
    console.log('Error: Duración de la meta menor a 3 meses:', endDate, minEndDateStr);
    return res.status(400).json({ errors: { date: 'La meta debe durar al menos 3 meses.' } });
  }
  // ----------------------------

  if (!unit || unit.trim() === '') {
    console.log('Error: Unidad de la meta vacía');
    return res.status(400).json({
      errors: { unit: 'La unidad de la meta es obligatoria.' }
    });
  }
  
  const unitsWithInitialOne = [
    "km", "kg", "horas", "minutos", "calorías", "COP", "dólares"
  ];
  
  const currentValue = unitsWithInitialOne.includes(unit) ? 1 : 0;

  try {
    console.log('Validación exitosa, guardando meta...');
    // Insertar la meta en la base de datos
    const result = await pool.query(
      `INSERT INTO goals (goal, description, start_date, end_date, unit, current_value, created_at, updated_at, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7) RETURNING *`,
      [goal, description, startDate, endDate, unit, currentValue, user.id]
    );
    
    const newGoal = result.rows[0];
    return res.status(201).json({ message: 'Meta creada con éxito', goal: newGoal });

  } catch (error) {
    console.error('Error en la creación de meta:', error);
    return res.status(500).json({
      errors: { general: 'Error del servidor, intenta de nuevo más tarde.' }
    });
  }
};
