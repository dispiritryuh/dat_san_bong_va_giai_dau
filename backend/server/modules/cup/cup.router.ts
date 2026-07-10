import { Router } from 'express';
import police from '../../share/police.share';
import { generateBracketController, submitCupScoreController,importTeamsController } from './cup.controller';

const router = Router();
router.post('/generate-bracket', police.required, generateBracketController);
router.patch('/submit-score', police.required, submitCupScoreController);
router.post('/importTeam',police.required,importTeamsController);
export default router;