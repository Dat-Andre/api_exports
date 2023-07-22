import fs from 'fs'
import path from 'path'
import { execSync } from "child_process";

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

const getFileNameByType = (type: Type): string | undefined => {
    if (type === Type.AUTH) {
        return FileByType.AUTH;
    } else if (type === Type.BANK) {
        return FileByType.BANK;
    } else if (type === Type.STAKING) {
        return FileByType.STAKING;
    }
};


const isFileDecompressed = (decompressedRootPath: string, height: string): boolean => {
    const decompressedPath = path.join(decompressedRootPath, height);
    return fs.existsSync(decompressedPath);
};

// TODO: same for this, if it snot there we can just error.
const isHeightAvailable = (compressedRootPath: string, height: string): boolean => {
    const height_list: number[] = getSortedHeightsList(compressedRootPath);
    const height_int = Number(height);
    const height_available = height_list.includes(height_int);
  
    return height_available;
  };
  
const getSortedHeightsList = (compressedRootPath: string): number[] => {
    const height_list: number[] = [];

    fs.readdirSync(compressedRootPath).forEach((file: any) => {
        const height = file.substring(0, file.indexOf("."));
        const height_int = Number(height);
        height_list.push(height_int);
    });

    // sort in descending order
    const sorted_height_list = height_list.sort(function (a, b) {
        return b - a;
    });

    return sorted_height_list;
};


const decompressFile = (compressedRootPath: string, compressed_ext: string, height: string, decompressedRootPath: string): boolean => {    
    const file = path.join(compressedRootPath, height + compressed_ext);

    if (isFileDecompressed(decompressedRootPath, height)) {
        return true;
    }

    const decompressCommand = `tar -xzf ${file} -C ${decompressedRootPath}`;
    
    try {
        execSync(decompressCommand);
        return true;
    } catch (error) {
        console.log("output", error);
        return false;
    }
};

// getData function at a specific height. Returns JSON or error.
const getDataJSONAtHeight = (height: string, type: string, decompressedRootPath: string): any => {    
    const filePath = path.join(decompressedRootPath, height, `${height}_${type}.json`);
    
    if (!Object.values(Type).includes(type as Type)) {
        return {
            error: "Type does not exist.",
        };
    }
    
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');        
        return JSON.parse(data);;
    } 
    
    return {
        error: "File does not exist.",
    };
}

export {
    getSortedHeightsList,
    getFileNameByType,
    isFileDecompressed,    
    decompressFile,
    getDataJSONAtHeight,
};