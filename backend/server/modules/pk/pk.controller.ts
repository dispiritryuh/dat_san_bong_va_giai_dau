import Httpexception from "../../model/http-exception.model";
import { sendChallenge,rejectChallenge,acceptChallenge,cancelChallenge,selectPitchp2p,DashBoard,getChatHistory } from "./pk.service";
import {Request,Response,NextFunction} from 'express';
export const sendChallengeController= async (req:Request,res:Response,Nes:NextFunction)=>{
    try{
         const challengerIdC=req.user?.id;
         const {opponentIdC,initialMessageC}=req.body;
        if(challengerIdC===undefined){
            throw new Httpexception(401,'must login');
        }
         const result=await sendChallenge(challengerIdC,opponentIdC,initialMessageC);
         res.json({ result});
    } catch(error){
 Nes(error);
    }
}
export const rejectChallengeController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const opponentIdC= req.user?.id;
           const {challengeIdC,challengerIdC}= req.body;
              if(opponentIdC===undefined){
            throw new Httpexception(401,'must login');
        }
        const result = await rejectChallenge(challengeIdC,challengerIdC,opponentIdC);
        
        res.json({result });
    } catch (error) {
        next(error);
    }
}
export const cancelChallengeController= async (req:Request,res:Response,Nes:NextFunction)=>{
    try{
         const challengerIdC=req.user?.id;
         const {challengeIdC,opponentIdC}=req.body;
        if(challengerIdC===undefined){
            throw new Httpexception(401,'must login');
        }
         const result=await cancelChallenge(challengeIdC,challengerIdC,opponentIdC);
         res.json({ result});
    } catch(error){
 Nes(error);
    }
}
export const acceptChallengeController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const opponentId = req.user?.id;
        const { challengeIdC } = req.body;

        if (!opponentId) {
            throw new Httpexception(401, 'Bạn phải đăng nhập!');
        }

        if (!challengeIdC) {
            throw new Httpexception(400, 'Thiếu ID kèo đấu!');
        }
        const result = await acceptChallenge(Number(challengeIdC), Number(opponentId));
        
        return res.json({ 
            success: true,
            message: "Đã chấp nhận thách đấu thành công!",
            result 
        });
    } catch (error) {
        next(error);
    }
}
export const selectPitchp2pController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const challengerIdC = req.user?.id; 
        const { challengeIdC, opponentIdC, input } = req.body; 
        if (!challengerIdC) throw new Httpexception(401, "Chưa đăng nhập!");
        if (  !challengeIdC || !input) throw new Httpexception(400, "Dữ liệu thiếu!");

        const result = await selectPitchp2p(challengeIdC, challengerIdC, opponentIdC, input);
        
        res.json({ result });
    } catch (error) {
        next(error);
    }
}
export const DashBoardController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result= await DashBoard();
       if (req.user) {
      return res.json({ result:result, isGuest: false });
    } else {
      return res.json({ result:result , isGuest: true });
    }
    } catch (error) {
        next(error);
    }
}
export const getChatHistoryController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { challengeId } = req.params;
        const result = await getChatHistory(Number(challengeId));
        res.json({ result });
    } catch (error) {
        next(error);
    }
}