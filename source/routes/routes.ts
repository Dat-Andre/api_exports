import express from "express";
import controller from "../controllers/handler";
const router = express.Router();

router.get(
  "/all",
  controller.avaliableHeights
);
router.get(
  "/latest",
  controller.latestHeight
);

// TODO: Testing function.
router.get(
  "/decompress/:height",
  controller.decompressTest
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
