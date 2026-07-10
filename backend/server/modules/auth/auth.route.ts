import {Router} from 'express';
import police from '../../share/police.share';
import { registerController,updateController,loginController,getuserController } from './auth.controller';
const router = Router();
router.post('/user',registerController);
router.post('/user/login',loginController);
router.get('/user',police.required,getuserController);
router.put('/user',police.required,updateController);
export default router;

