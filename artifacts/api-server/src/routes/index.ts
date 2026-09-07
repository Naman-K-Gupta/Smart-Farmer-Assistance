import { Router, type IRouter } from "express";
import healthRouter from "./health";
import smartFarmerRouter from "./smartFarmer";

const router: IRouter = Router();

router.use(healthRouter);
router.use(smartFarmerRouter);

export default router;
