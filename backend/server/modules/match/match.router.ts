import {Router} from 'express';
import { createMatchController,submitMatchController } from './match.controller';
import police from '../../share/police.share';
const router= Router();
router.use(police.required);
router.post('/create',createMatchController);
router.patch('/submit',submitMatchController);
export default router;