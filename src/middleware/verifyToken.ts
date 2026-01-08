import { Request, Response, NextFunction } from 'express';
import jwt from "jsonwebtoken";
import { pool } from '../index';
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET as string;

export const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extraer el token del header

    if (!token) {
      console.log("No se envió el token");
      res.status(401).json({ error: "Token no proporcionado" });
      return;
    }

    // Decodificar el token con un cast seguro
    const decoded = jwt.verify(token, SECRET_KEY) as { id: number };

    // Buscar el usuario en la base de datos y obtener su UUID
    const result = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0 || !result.rows[0].uuid) {
      console.log("Token no válido o usuario no encontrado");
      res.status(403).json({ error: "Token inválido o usuario no encontrado" });
      return;
    }

    // Guardar el usuario en la request para su uso en otros controladores
    (req as any).user = result.rows[0];

    next(); // Pasar al siguiente middleware o controlador
  } catch (error: any) {
    console.error("Error al verificar el token:", error.message);
    res.status(401).json({ error: "Token inválido" });
  }
};
