import {getSortedHeightsList, decompressFile, getDataJSONAtHeight} from './helpers'
import { Request, Response, NextFunction } from "express";

// TODO: Prob move to main server.ts file then import here
const compressedRootPath = process.env.COMPRESSED_ROOT_PATH ?? "./export_assets_compressed/";
const decompressedRootPath = process.env.DECOMPRESSED_ROOT_PATH ?? "./export_assets_uncompressed/";
const COMPRESSED_EXTENSION = ".tar.xz";

// pairs the type -> the main key and object key in the data to filter by.
const typeToKeys: any = {
    "bank": ["balances", "address"],
    "staking": ["delegations", "delegator_address"],    
    "auth": ["accounts", "address"],
}

const avaliableHeights = (
    req: Request,
    res: Response,
    next: NextFunction
): Response => {
    const heights: number[] = getSortedHeightsList(compressedRootPath);

    return res.status(200).json({
        heights,
    });
}

const latestHeight = (
    req: Request,
    res: Response,
    next: NextFunction
): Response => {    
    const latestHeight = getSortedHeightsList(compressedRootPath)[0];

    return res.status(200).json({
        latestHeight,
    });
}

const getDataAtHeight = (
    req: Request,
    res: Response,
    next: NextFunction
): Response => {        
    let height = req.params.height.toString();
    if (height === "latest") {
        height = getSortedHeightsList(compressedRootPath)[0].toString();
    }

    // decompresses file if it is not already
    decompressFile(compressedRootPath, COMPRESSED_EXTENSION, height, decompressedRootPath);

    // ex: bank, auth, staking. TODO: Validate func instead of doing in getDataJSONAtHeight
    const type = req.params.type;
    
    // TODO: REDIS/memory cache on top of this?
    const data = getDataJSONAtHeight(height, type, decompressedRootPath);

    // if data has an error value
    if (data.error) {
        return res.status(400).json({
            error: data.error,
        });
    }
    
    return res.status(200).json({
        data,
    });
}

const getUserAtHeight = (
    req: Request,
    res: Response,
    next: NextFunction
): Response => {
    // get a height, type, and address.
    let height = req.params.height.toString();
    if (height === "latest") {
        height = getSortedHeightsList(compressedRootPath)[0].toString();
    }

    const type = req.params.type;
    const address = req.params.address;

    // decompresses file if it is not already
    // TODO: Move this to getDataJSONAtheight instead?
    decompressFile(compressedRootPath, COMPRESSED_EXTENSION, height, decompressedRootPath);

    // get data from file
    const data = getDataJSONAtHeight(height, type, decompressedRootPath);    

    const parentKey: string = typeToKeys[type][0];
    const findKey: string = typeToKeys[type][1];    

    // find all instances in the data as an array
    const instances = data[parentKey].filter((obj: any) => obj[findKey] === address);

    if (instances === undefined) {
        return res.status(400).json({
            error: "Wallet data not found.",
        });
    }

    // TODO: Add height
    return res.status(200).json({
        height: height,
        request: type,
        instances,
    });
}

// TODO: remove this. Just for testing.
const decompressTest = (
    req: Request,
    res: Response,
    next: NextFunction
): Response => {
    const height = req.params.height;
    const success = decompressFile(compressedRootPath, COMPRESSED_EXTENSION, height, decompressedRootPath);

    return res.status(200).json({
        success: success,
    });
}




export default {  
    avaliableHeights,
    latestHeight,
    decompressTest,
    getDataAtHeight,
    getUserAtHeight,
  };