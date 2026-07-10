import {Request,Response,NextFunction} from 'express';
import { checkPitchempty,findAvailablePitches,getuserProfile,getOpenChallenges } from './bookings.service';
export const bookingPitchcontroller= async(req:Request,res:Response,ne:NextFunction)=>{
try{
    const UserId=req.user!.id;
    const input=req.body;
    const result= await checkPitchempty(UserId,input);
    res.status(200).json({
        mess:"payment and booking ok",
        data:result,
    });
}catch(error){
    ne(error);
}
}
export const findAvailablePitchesController= async(req:Request,res:Response,ne:NextFunction)=>{
    try{
        const {startTime,endTime}=req.query;
        const result= await findAvailablePitches({
            startTime:String(startTime),
            endTime: String(endTime)
        });
        res.status(200).json({
            data:result
        });
    }catch(error){
        ne(error);
    }
}
export const getuserProfileController= async(req:Request,res:Response,ne:NextFunction)=>{
try{
    const UserId=req.user!.id;
    const result= await getuserProfile(UserId);
    res.status(200).json({
        result:result,
    });
}catch(error){
    ne(error);
}
}
export const getOpenChallengesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const challenges = await getOpenChallenges();
        res.json({
            success: true,
            result: challenges
        });
    } catch (error) {
        next(error);
    }
};