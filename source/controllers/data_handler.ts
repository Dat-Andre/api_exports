import fs from "fs";
import { execSync } from "child_process";
import { Request, Response, NextFunction } from "express";

// TODO: Prob move to main server.ts file then import here
const compressedRootPath = process.env.COMPRESSED_ROOT_PATH ?? "./export_assets_compressed/";
const decompressedRootPath = process.env.DECOMPRESSED_ROOT_PATH ?? "./export_assets_uncompressed/";
const COMPRESSED_EXTENSION = ".tar.xz";

const init = () => {
  // call for basic setup

  // create decompressedRootPath if not exist
  if (!fs.existsSync(decompressedRootPath)) {
    fs.mkdirSync(decompressedRootPath);
  }
  
  if (!fs.existsSync(compressedRootPath)) {
    throw new Error("Compressed root path does not exist. " + compressedRootPath);
  }
}

const getFileNameByType = (type: Type): string | undefined => {
  if (type === Type.AUTH) {
    return FileByType.AUTH;
  } else if (type === Type.BANK) {
    return FileByType.BANK;
  } else if (type === Type.STAKING) {
    return FileByType.STAKING;
  }
};

export enum Type {
  AUTH = "auth",
  BANK = "bank",
  STAKING = "staking",
}

export enum FileByType {
  AUTH = "_auth.json",
  BANK = "_bank.json",
  STAKING = "_staking.json",
}

const getAvailableHeightList = (): number[] => {
  const height_list: number[] = [];
  fs.readdirSync(compressedRootPath).forEach((file: any) => {
    const height = file.substring(0, file.indexOf("."));
    const height_int = Number(height);
    height_list.push(height_int);
  });
  const sorted_height_list = height_list.sort(function (a, b) {
    return b - a; // sort in descending order
  });

  return sorted_height_list;
};

const isFileDecompressed = (height: string): boolean => {
  const file = fs.readdirSync(decompressedRootPath).find((fileName) => {
    return fileName === height;
  });

  return file === undefined ? false : true;
};

const isHeightAvailable = (height: string): boolean => {
  const height_list: number[] = getAvailableHeightList();
  const height_int = Number(height);
  const height_available = height_list.includes(height_int);

  return height_available;
};

const getLatestHeightInfoFromCompressedFolder = (
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  const sorted_height_list = getAvailableHeightList();

  return res.status(200).json({
    latestHeight: sorted_height_list[0]?.toString(),
  });
};

const avaliableHeights = (
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  const height_list: number[] = getAvailableHeightList();

  return res.status(200).json({
    height_list,
  });
}

const getDecompressedJsonData = (type: Type, height: string): any => {
  const typeFolderPath = getFileNameByType(type);
  if (!typeFolderPath) throw new Error("Type not recognised");
  const decompressedPathToHeightFolder = decompressedRootPath + height + "/";

  const decompressedFile = decompressedPathToHeightFolder + height + typeFolderPath;

  // read decompressedFile sync
  const file = fs.readFileSync(decompressedFile, "utf8");

  var jsonResult = JSON.parse(file);
  return jsonResult;
};



const getDecompressedJsonDataByHeightAndType = (
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  let height: string = req.params.height;
  let type = req.params.type as Type;

  // check if height file exists compressed
  const heightAvailable = isHeightAvailable(height);

  // check if height file exists decompressed
  const decompressedExists = isFileDecompressed(height);

  // if not, decompress
  if (!decompressedExists && heightAvailable) {
    //console.log("decompressedExists: ", decompressedExists);
    decompressFile(height);    
  }
  // return json data
  let data;
  try {
    data = getDecompressedJsonData(type, height);
    if (data === undefined)
      return res.status(400).json({
        message: "File not found",
      });
  } catch (error) {
    return res.status(400).json({
      message: "Error while getting uncompressed file." + error,
    });
  }

  return res.status(200).json({
    data,
  });
};

const getFilteredDataByAddress = (
  data: any,
  type: Type,
  address: string
): any[] => {
  let searchResult: any[] = [];
  switch (type) {
    case Type.AUTH:
      ifNullOrUndefinedDoNothing(
        data.accounts.find((account: any) => account.address === address),
        searchResult
      );
      break;
    case Type.BANK:
      ifNullOrUndefinedDoNothing(
        data.balances.find((balance: any) => balance.address === address),
        searchResult
      );
      break;
    case Type.STAKING:
      ifNullOrUndefinedDoNothing(
        data.delegations.filter(
          (delegation: any) => delegation.delegator_address === address
        ),
        searchResult
      );
  }

  return searchResult;
};

const ifNullOrUndefinedDoNothing = (data: any, results: any[]) => {
  if (data === null || data === undefined) {
    return [];
  } else {
    return results.push(data);
  }
};

const getDecompressedJsonDataByHeightTypeAndAddress = (
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  let height: string = req.params.height;
  let type = req.params.type as Type;
  let address = req.params.address;

  // check if height file exists compressed
  const heightAvailable = isHeightAvailable(height);

  // check if height file exists decompressed
  const decompressedExists = isFileDecompressed(height);

  // if not, decompress
  if (!decompressedExists && heightAvailable) {
    decompressFile(height);
  }

  // return json data
  let data;
  try {
    data = getDecompressedJsonData(type, height);
    if (data === undefined)
      return res.status(400).json({
        message: "File not found",
      });
  } catch (error) {
    return res.status(400).json({
      message: "Error while getting uncompressed file" + error,
    });
  }

  const filteredData = getFilteredDataByAddress(data, type, address);

  return res.status(200).json({
    filteredData,
  });
};

const getLatestHeightDecompressedJsonDataByType = (
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  let type = req.params.type as Type;

  let latestHeight: string;
  try {
    const sorted_height_list = getAvailableHeightList();
    latestHeight = sorted_height_list[0].toString();
  } catch (error) {
    return res.status(400).json({
      message: "Error while getting latest height",
    });
  }

  const decompressedExists = isFileDecompressed(latestHeight);

  if (!decompressedExists) {
    decompressFile(latestHeight);
  }

  let data;
  try {
    data = getDecompressedJsonData(type, latestHeight);
    if (data === undefined)
      return res.status(400).json({
        message: "File not found",
      });
  } catch (error) {
    return res.status(400).json({
      message: "Error while getting uncompressed file" + error,
    });
  }

  return res.status(200).json({
    data,
  });
};

const getLatestHeightDecompressedJsonDataByTypeAndAddress = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let type = req.params.type as Type;
  let address = req.params.address;

  let latestHeight: string;
  try {
    const sorted_height_list = getAvailableHeightList();
    latestHeight = sorted_height_list[0].toString();
  } catch (error) {
    return res.status(400).json({
      message: "Error while getting latest height",
    });
  }

  // check if height file exists decompressed
  const decompressedExists = isFileDecompressed(latestHeight);

  // if not, decompress
  if (!decompressedExists) {
    decompressFile(latestHeight);
  }

  // return json data
  let data;
  try {
    data = getDecompressedJsonData(type, latestHeight);
    if (data === undefined)
      return res.status(400).json({
        message: "File not found",
      });
  } catch (error) {
    return res.status(400).json({
      message: "Error while getting uncompressed file",
    });
  }

  const filteredData = getFilteredDataByAddress(data, type, address);

  return res.status(200).json({
    filteredData,
  });
};

export default {  
  avaliableHeights,
  getLatestHeightInfoFromCompressedFolder,
  getLatestHeightDecompressedJsonDataByType,
  getLatestHeightDecompressedJsonDataByTypeAndAddress,
  getDecompressedJsonDataByHeightAndType,
  getDecompressedJsonDataByHeightTypeAndAddress,
};

// call init on run
init();