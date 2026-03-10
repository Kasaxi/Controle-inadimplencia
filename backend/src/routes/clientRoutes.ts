import { Router } from 'express';
import * as clientController from '../controllers/clientController';

const router = Router();

router.get('/', clientController.getAllClients);
router.post('/', clientController.createClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

export default router;
