import jwt from "jsonwebtoken";

const GenerateToken=(id:number,role:string): string =>
    jwt.sign({id,role},process.env.JWT_SECRET|| 'superSecret',{expiresIn:"90d"});
export default GenerateToken;