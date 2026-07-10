import { Router } from 'express';
import police from '../../share/police.share';
import { createTeamController, updateTeamController } from './team.controller';

const router = Router();

router.post('/team', police.required, createTeamController);
router.put('/team/:id', police.required, updateTeamController);

export default router;