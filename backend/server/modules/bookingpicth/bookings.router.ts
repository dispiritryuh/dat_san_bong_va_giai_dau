import {Router} from 'express';
import police from '../../share/police.share';
import { bookingPitchcontroller, getOpenChallengesController,findAvailablePitchesController,getuserProfileController } from './bookings.controller';
const router= Router();
router.post('/booking',police.required,bookingPitchcontroller);
router.get('/find',police.required,findAvailablePitchesController);
router.get('/getUserProfile',police.required,getuserProfileController);
router.get('/list', getOpenChallengesController);
export default router;