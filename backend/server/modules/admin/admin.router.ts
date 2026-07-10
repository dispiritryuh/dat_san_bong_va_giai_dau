import express from 'express';
import { 
  updatePitchPriceController, 
  updatePitchStatusController, 
  getRevenueController ,
  getSystemPriceController,
  createPitchController,
  getAllPitchesController
} from './admin.controller';

import { isAdmin } from '../../share/police.share';
import police from '../../share/police.share';
const router = express.Router();

router.put(
  '/pitch/price', 
  police.required, 
  isAdmin, 
  updatePitchPriceController
);


router.put(
  '/pitch/status', 
  police.required, 
  isAdmin, 
  updatePitchStatusController
);

router.get(
  '/revenue', 
  police.required, 
  isAdmin, 
  getRevenueController
);
router.get(
    '/getPrice',
    police.required,
getSystemPriceController
)
router.post(
  '/createPitch',
  police.required,
  isAdmin,
  createPitchController
)
router.get(
  '/getallPitch',
  police.required,
  isAdmin,
getAllPitchesController
)
export default router;