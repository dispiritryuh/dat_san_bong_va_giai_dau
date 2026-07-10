import { Request, Response, NextFunction } from 'express';
import { createTeam, updateTeam } from './team.service';

export const createTeamController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const team = await createTeam(Number(userId), req.body);
    res.status(201).json({ team });
  } catch (error) {
    next(error);
  }
};

export const updateTeamController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const teamId = req.params.id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!teamId) return res.status(400).json({ message: "Missing team ID" });

    const team = await updateTeam(Number(userId), Number(teamId), req.body);
    res.status(200).json({ team });
  } catch (error) {
    next(error);
  }
};