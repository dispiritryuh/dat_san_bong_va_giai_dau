import prisma from "../../../prisma/prisma-client";
import { Prisma } from "@prisma/client";
import Httpexception from "../../model/http-exception.model";
//sua gia san
//sua trang thai san
//xem doanh thu
export const changePitchPrice= async(PitchId:number,newPrice:number)=>{
const pitch= await prisma.pitch.findUnique({
    where:{
     id:PitchId,   
    }
})
if(!pitch){
    throw new Httpexception(422,{"pitch":["canceled"]});
}
const updatePitch= await prisma.pitch.update({
    where:{
        id:PitchId,
    },
data:{
    basePrice:newPrice,
},
});
return updatePitch;
}
export const changePitchStatus= async(PitchId:number,newStatus:string)=>{
const pitch= await prisma.pitch.findUnique({
    where:{
     id:PitchId,   
    }
})
if(!pitch){
    throw new Httpexception(422,{"pitch":["canceled"]});
}
const updatePitch= await prisma.pitch.update({
    where:{
        id:PitchId,
    },
data:{
    status:newStatus,
},
});
return updatePitch;
}
export const  getRevenue= async(
    fromDate:string|Date,
 inDate:string|Date,
 type:'hour'|'day'|'month'
)=>{
    const bookings= await prisma.booking.findMany({
        where:{
            status:"resolved",
            startTime:{
                gte: new Date(fromDate),
                lte: new Date(inDate),
            },
        },
        select:{
            startTime:true,
            totalPrice:true,

        },
        orderBy:{
            startTime:'asc',
        }
    });
    if(bookings.length===0) {
        return {
        totalRevenue:0,
         chartData:[]
        };
    }
    let totalRevenue=0;
    const groupData=bookings.reduce<Record<string,number>>((acc,booking)=>{
const date= new Date(booking.startTime);
let key="";
switch (type) {
      case 'hour':
        const h = date.getHours().toString().padStart(2, '0');
        key = `${h}:00`; 
        break;
      case 'day':
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        key = `${y}-${m}-${d}`;
        break;
      case 'month':
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const yyyy = date.getFullYear();
        key = `${yyyy}-${mm}`;
        break;
    }
    acc[key] = (acc[key] || 0) + booking.totalPrice;
    totalRevenue += booking.totalPrice;
    
    return acc;
  }, {}
    );
    const chartData = Object.keys(groupData).map(key => ({
    time: key,
    revenue: groupData[key]
  }));

  return {
    totalRevenue,
    chartData
  };
}
// lay gia
export const getSystemPrice = async (pitchId: number) => {
  const pitch = await prisma.pitch.findUnique({
    where: { 
      id: pitchId 
    },
    select: { 
      basePrice: true,
      status: true 
    }
  });

  if (!pitch) {
    throw new Httpexception(404, { pitch: ["not found"] });
  }

  if (pitch.status !== "ACTIVE") {
    throw new Httpexception(400, { pitch: ["is currently unavailable or under maintenance"] });
  }
  return pitch.basePrice;
};
//them san
export const createPitch = async (name: string, basePrice: number) => {
  if (!name || !basePrice) {
    throw new Httpexception(422, { error: ["Tên sân và giá không được để trống"] });
  }

  const newPitch = await prisma.pitch.create({
    data: {
      name: name.trim(),
      basePrice: basePrice,
      status: "ACTIVE", 
    },
  });
  return newPitch;
};
// lay full san
export const getAllPitches = async () => {
  const pitches = await prisma.pitch.findMany({
    orderBy: {
      id: 'asc', 
    },
  });
  return {
    totalCount: pitches.length,
    data: pitches,
  };
};