import { IStorageProvider } from "./storageProvider";
import { IAsset, AssetType } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";
import * as Azure from "@azure/storage-blob"
import { TokenCredential, AnonymousCredential, SharedKeyCredential, ContainerURL, StorageURL, ServiceURL } from "@azure/storage-blob";

export interface IAzureCloudStorageOptions {
    accountName: string;
    containerName: string;
    createContainer: boolean;
    
    token?: string;
    connectionString?: string;
    accountKey?: string;
}

export class AzureCloudStorageService implements IStorageProvider {

    private static getFileName(path: string) {
        return path.substring(path.indexOf("/") + 1);
    }

    constructor(private options?: IAzureCloudStorageOptions) {}

    public readText(path: string) {
        return new Promise<string>((resolve, reject) => {
            this.getServiceURL().getBlobToText(
                this.options.containerName,
                AzureCloudStorageService.getFileName(path),
                (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                },
            );
        });
    }

    public async readBinary(path: string) {
        const text = await this.readText(path);
        return Buffer.from(text);
    }

    public async writeText(path: string, contents: string | Buffer) {
        if (this.options.createContainer) {
            await this.createContainer(this.options.containerName);
        }
        return new Promise<void>((resolve, reject) => {
            this.getServiceURL().createBlockBlobFromText(
                this.options.containerName,
                AzureCloudStorageService.getFileName(path),
                contents,
                (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                },
            );
        });
    }

    public writeBinary(path: string, contents: Buffer) {
        return this.writeText(path, contents);
    }

    public deleteFile(path: string) {
        return new Promise<void>((resolve, reject) => {
            this.getServiceURL().deleteBlobIfExists(
                this.options.containerName,
                AzureCloudStorageService.getFileName(path),
                (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                },
            );
        });
    }

    public listFiles(path: string) {
        return new Promise<string[]>((resolve, reject) => {
            this.getServiceURL().listBlobsSegmented(
                this.options.containerName,
                null,
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                },
            );
        });
    }

    public listContainers(path: string) {
        return new Promise<string[]>((resolve, reject) => {
            this.getServiceURL().listContainersSegmented(null, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }

    public createContainer(containerName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            ContainerURL.fromServiceURL(
                null,
                containerName
            )
        });
    }

    public deleteContainer(path: string) {
        return new Promise<void>((resolve, reject) => {
            this.getServiceURL().deleteContainer(
                this.options.containerName,
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                },
            );
        });
    }

    public async getAssets(path?: string): Promise<IAsset[]> {
        if (this.options.containerName) {
            path = path ? [this.options.containerName, path].join("/") : this.options.containerName;
        }
        const files = await this.listFiles(path);
        const result: IAsset[] = [];
        for (const key of Object.keys(files.entries)) {
            const url = this.getUrl(files.entries[key].name);
            const asset = AssetService.createAssetFromFilePath(url);
            if (asset.type !== AssetType.Unknown) {
                result.push(asset);
            }
        }
        return result;
    }

    private getAccountName(): string {
        if (this.options.accountName) {
            return this.options.accountName;
        }
        else{
            const regex = /AccountName=([a-zA-Z0-9-]*)/g;
            const match = regex.exec(this.options.connectionString);
            return match[1];
        }
    }

    private getAccountKey(): string {
        if(this.options.accountKey){
            return this.options.accountKey;
        }
        else{
            const regex = /AccountKey=([a-zA-Z0-9-]*)/g;
            const match = regex.exec(this.options.connectionString);
            return match[1];
        }        
    }

    private getHostName(): string {
        return `https://${this.getAccountName()}.blob.core.windows.net`;
    }

    private getCredential() {
        if (this.options.token) {
            return new TokenCredential(this.options.token);
        }
        else if (this.options.connectionString) {
            return new SharedKeyCredential(
                this.getAccountName(),
                this.getAccountKey()
            );
        }
        else {
            return new AnonymousCredential();
        }
    }

    private getServiceURL() {
        const credential = this.getCredential();
        const pipeline = StorageURL.newPipeline(credential);
        const serviceUrl = new ServiceURL(
            this.getHostName(),
            pipeline
        )
        return serviceUrl;
    }

    private getUrl(blobName: string) {
        // return this.getServiceURL().getUrl(
        //     this.options.containerName,
        //     blobName,
        //     null,
        //     AzureCloudStorageService.getHostName(this.options.connectionString),
        // );
    }
}
