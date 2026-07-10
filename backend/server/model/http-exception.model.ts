import { error } from "node:console";

class Httpexception extends Error{
errorCode:number;
constructor(errorCode:number,public readonly messenge:string|any){
    super(messenge);
    this.errorCode=errorCode;
}
}
export default Httpexception;