import { Request, Response } from "express";
import { pool } from "../index";

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user; // Ya está disponible gracias a verifyToken

        if (!user) {
            console.log('No se encontró usuario en la petición');
            res.status(401).json({ errors: { general: "Usuario no autenticado" } });
            return;
        }

        await pool.query('UPDATE users SET uuid = NULL WHERE id = $1', [user.id]);
        console.log('Sesión cerrada correctamente');

        res.json({ message: "Sesión cerrada correctamente" });
    } catch (error) {
        console.error("Error en el cierre de sesión:", error);
        res.status(500).json({ errors: { general: "Error interno del servidor" } });
    }
};
