export interface GenerateResult {
    pathList: string[];
    spriteList: string[];
}
export declare const generate: (inputPath: string) => GenerateResult;
