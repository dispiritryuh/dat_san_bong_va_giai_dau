import Httpexception from "../../model/http-exception.model";
import { Request, Response, NextFunction } from 'express';
import { createMatch, submitMatchResult } from "./match.service";

export const createMatchController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { challengeId } = req.body;
        if (!challengeId) {
            throw new Httpexception(400, "Thiếu challengeId!");
        }
        
        const result = await createMatch(Number(challengeId));
        return res.json({ data: result }); 
    } catch (error) {
        next(error);
    }
}

export const submitMatchController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { matchId, goalsA, goalsB } = req.body;
        
        if (matchId === undefined || goalsA === undefined || goalsB === undefined) {
            throw new Httpexception(400, "Thiếu tỉ số!");
        }

        const result = await submitMatchResult(
            Number(matchId), 
            Number(goalsA), 
            Number(goalsB)
        );
        
        return res.json({
            data: result
        });
    } catch (error) {
        next(error);
    }
};