import z, { keyof } from "zod";
// dang nhap
//dang ki
// update tai khoan
export const UserSchema= z.object({
    id:z.number(),
    username:z.string(),
    email:z.string().email(),
    password:z.string().min(6)
})
export type UserType = z.infer<typeof UserSchema>;
export const zodLogin=UserSchema.omit({id:true,email:true});
export type LoginInput = z.infer<typeof zodLogin>;
export const zodRegister=UserSchema.omit({id:true});
export type RegisterInput=z.infer<typeof zodRegister>;

  // cho nay can xem lai ki lien ket email
//team
export const zodTeam=z.object({
    id:z.number(),
    name:z.string(),
    description:z.string().optional(),
    leaderId: z.number()
});
export type TeamInput = z.infer<typeof zodTeam>;
//update team
export const updateTeam=zodTeam.partial();
export type UpdateTeamInput = z.infer<typeof updateTeam>;
//bat loi
//chon san
export const pickPitch=z.object({
    PitchId:z.number(),
    startTime:z.coerce.date(),
   endTime:z.coerce.date()
});
export type pickPitchInput=z.infer<typeof pickPitch>;