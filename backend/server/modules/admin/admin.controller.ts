import { Request, Response, NextFunction } from 'express';
import Httpexception from '../../model/http-exception.model';
import { changePitchPrice, changePitchStatus, getRevenue ,getSystemPrice,createPitch,getAllPitches} from './admin.service'; 

export const updatePitchPriceController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pitchId = Number(req.body.pitchId);
    const newPrice = Number(req.body.newPrice);

    if (!pitchId) {
      throw new Httpexception(422, { pitchId: ["can't be blank"] });
    }
    if (!newPrice) {
      throw new Httpexception(422, { newPrice: ["can't be blank"] });
    }

    const updatedPitch = await changePitchPrice(pitchId, newPrice);

    res.json({ 
      message: "update price success",
      pitch: updatedPitch 
    });
  } catch (error) {
    next(error);
  }
};

export const updatePitchStatusController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pitchId = Number(req.body.pitchId);
    const newStatus = req.body.newStatus;

    if (!pitchId) {
      throw new Httpexception(422, { pitchId: ["can't be blank"] });
    }
    if (!newStatus) {
      throw new Httpexception(422, { newStatus: ["can't be blank"] });
    }

    const updatedPitch = await changePitchStatus(pitchId, newStatus);

    res.json({ 
      message: "update status pitch success",
      pitch: updatedPitch 
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromDate, inDate, type } = req.query;

    if (!fromDate) {
      throw new Httpexception(422, { fromDate: ["can't be blank"] });
    }
    if (!inDate) {
      throw new Httpexception(422, { inDate: ["can't be blank"] });
    }
    const viewType = (type as 'hour' | 'day' | 'month') || 'day';

    const result = await getRevenue(fromDate as string, inDate as string, viewType);

    res.json({ 
      revenueData: result 
    });
  } catch (error) {
    next(error);
  }
};
export const getSystemPriceController=async(req:Request,res:Response,next:NextFunction)=>{
   try{ const id= req.body;
    const result= await getSystemPrice(id);
    res.json({
        result
    });} catch(error){
        next(error);
    }
}
export const createPitchController= async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const {name,basePrice}= req.body;
    const result= await createPitch(name,basePrice);
    res.json({
      result
    });
  }catch(error){
    next(error);
  }
}
export const getAllPitchesController= async (req:Request,res:Response,next:NextFunction)=>{
  try{
    const result= await getAllPitches();
    res.json({
      result
    });
  }catch(error){
    next(error);
  }
}