import prisma from "../../prisma/prisma-client"

export const BtransferA=async (AId:number,BId:number,money:number)=>{
    await prisma.$transaction([
prisma.users.update({
    where:{
        id:BId,
balance:{gte:money},
    },
    data:{
        balance:{decrement:money},
    }
}),
prisma.users.update({
    where:{
        id:AId,
    },
    data:{
        balance:{increment:money},
    }
})
    ]);
};