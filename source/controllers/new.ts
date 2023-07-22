import {getSortedHeightsList, getFileNameByType, isFileDecompressed, decompressFile} from './helpers'
import { Request, Response, NextFunction } from "express";

// TODO: Prob move to main server.ts file then import here
const compressedRootPath = process.env.COMPRESSED_ROOT_PATH ?? "./export_assets_compressed/";
const decompressedRootPath = process.env.DECOMPRESSED_ROOT_PATH ?? "./export_assets_uncompressed/";
const COMPRESSED_EXTENSION = ".tar.xz";

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

import path from 'path'
import fs from 'fs'

const getDataAtHeight = (
    req: Request,
    res: Response,
    next: NextFunction
): Response => {
    // if height is not set, it is latest
    const height = (req.params.height ?? getSortedHeightsList(compressedRootPath)[0]).toString();

    // decompresses file if it is not already
    decompressFile(compressedRootPath, COMPRESSED_EXTENSION, height, decompressedRootPath);

    // return the json of the type (ex: bank)
    const type = req.params.type;
    
    // TODO: convert to helper
    const filePath = path.join(decompressedRootPath, height, `${height}_${type}.json`);

    // if filePath exist, read it into json
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');

        // convert data to json object
        const json = JSON.parse(data);
        return res.status(200).json({
            json,
        });
    } 

    // if filePath does not exist, return error 
    return res.status(404).json({
        message: "File not found: " + filePath,
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
  };