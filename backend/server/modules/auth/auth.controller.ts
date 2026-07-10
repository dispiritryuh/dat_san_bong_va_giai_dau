import { createUser, Login, getCurrentUser, updateUser } from "./auth.service";
import { Request, Response, NextFunction } from 'express';

export const registerController = async (req: Request, res: Response, nex: NextFunction) => {
  try {
    const user = await createUser(req.body.user);
    res.json({ user });
  } catch (error) {
    nex(error);
  }
};

export const loginController = async (req: Request, res: Response, nex: NextFunction) => {
  try {
    const user = await Login(req.body.user);
    res.json({ user });
  } catch (error) {
    nex(error);
  }
};

export const getuserController = async (req: Request, res: Response, nex: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(400).json({ message: "Lỗi không tìm thấy ID người" });
    }

    const user = await getCurrentUser(userId);
    res.json({ user });
  } catch (error) {
    nex(error);
  }
};

export const updateController = async (req: Request, res: Response, nex: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(400).json({ message: "Lỗi Token: Không tìm thấy ID người" });
    }

    const updateData = req.body.user || req.body.userPull;

    const user = await updateUser(updateData, userId);
    res.json({ user });
  } catch (error) {
    nex(error);
  }
};