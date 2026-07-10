import { Request, Response, NextFunction } from 'express';
import { generateKnockoutBracket,submitCupScore,importTeamsAndStartCup } from './cup.service';
export const generateBracketController = async (req: Request, res: Response, ne: NextFunction) => {
    try {
        const { cupId, teamIds } = req.body;
        
        const result = await generateKnockoutBracket(Number(cupId), teamIds);
        
        res.status(200).json({
            mess: "create bracket ok",
            data: result,
        });
    } catch (error) {
        ne(error);
    }
};

export const submitCupScoreController = async (req: Request, res: Response, ne: NextFunction) => {
    try {
        const { matchId, goalsA, goalsB } = req.body;
        
        const result = await submitCupScore(Number(matchId), Number(goalsA), Number(goalsB));
        
        res.status(200).json({
            mess: "submit cup score and advance ok",
            data: result,
        });
    } catch (error) {
        ne(error);
    }
};
export const importTeamsController = async (req: Request, res: Response, ne: NextFunction) => {
    try {
        const organizerId = req.user!.id; 
        const { cupId, teamIds } = req.body;
        const result = await importTeamsAndStartCup(Number(cupId), organizerId, teamIds);
        res.status(200).json({
            mess: "import teams and start cup success",
            data: result,
        });
    } catch (error) {
        ne(error);
    }
};