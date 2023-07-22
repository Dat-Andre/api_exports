import express from "express";
// import controller from "../controllers/data_handler";
import controller from "../controllers/new";
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

router.get(
  "/latest/:type",
  controller.getDataAtHeight
);
router.get(
  "/:height/:type",
  controller.getDataAtHeight
);

// router.get(
//   "/latest/:type/:address",
//   controller.getLatestHeightDecompressedJsonDataByTypeAndAddress
// );
// router.get("/:height/:type", controller.getDecompressedJsonDataByHeightAndType);
// router.get(
//   "/:height/:type/:address",
//   controller.getDecompressedJsonDataByHeightTypeAndAddress
// );



export = router;
