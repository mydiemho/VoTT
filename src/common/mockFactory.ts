import _ from "lodash";
import { AssetState, IAsset, AssetType, IProject } from "../models/applicationState";
import { IAzureCloudStorageOptions } from "../providers/storage/azureBlobStorage";
import { StorageURL, ContainerURL, BlockBlobURL } from "@azure/storage-blob";

export default class MockFactory {
    public static createTestAsset(name: string, assetState: AssetState = AssetState.NotVisited): IAsset {
        return {
            id: `asset-${name}`,
            format: "jpg",
            name: `Asset ${name}`,
            path: `C:\\Desktop\\asset${name}.jpg`,
            state: assetState,
            type: AssetType.Image,
            size: {
                width: 800,
                height: 600,
            },
        };
    }

    public static createTestAssets(count: number = 10): IAsset[] {
        const assets: IAsset[] = [];
        for (let i = 1; i <= count; i++) {
            assets.push(MockFactory.createTestAsset(i.toString()));
        }

        return assets;
    }

    public static createTestProject(): IProject {
        return {
            id: "project-1",
            name: "Project 1",
            assets: {},
            exportFormat: null,
            sourceConnection: {
                id: "connection-1",
                name: "Connection 1",
                providerType: "test",
                providerOptions: {},
            },
            targetConnection: {
                id: "connection-1",
                name: "Connection 1",
                providerType: "test",
                providerOptions: {},
            },
            tags: [],
            autoSave: true,
        };
    }

    public static azureOptions(): IAzureCloudStorageOptions {
        return {
            accountName: "myaccount",
            containerName: "container",
            createContainer: false,
        }
    }

    public static listContainersResponse() {
        return {
            containerItems: MockFactory.azureContainers(),
            nextMarker: null
        }
    }

    public static azureContainers(count: number=3) {
        let result = []
        for(let i = 0; i < count; i++){
            result.push({
                name: `container${count}`,
                blobs: MockFactory.azureBlobs(i)
            })
        }
        return result;
    }

    public static azureBlobs(id: number, count:number=10) {
        let result = []
        for(let i = 0; i < count; i++){
            result.push({
                name: `blob-${id}-${i}.jpg`
            })
        }
        return result;
    }
}
