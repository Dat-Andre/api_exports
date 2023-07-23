import express from "express";
import controller from "../controllers/handler";
const router = express.Router();

router.get(
  "/heights",
  controller.avaliableHeights
);

router.get(
  "/:height/delegations/:valoper_address",
  controller.getDelegationsTo
);

// /:height can also be /latest
router.get(
  "/:height/:type",
  controller.getDataAtHeight
);

// /:height can also be /latest
router.get(
  "/:height/:type/:address",
  controller.getUserAtHeight
);


export = router;
