import { AzureCloudStorageService, IAzureCloudStorageOptions } from "./azureBlobStorage";
import { StorageProviderFactory } from "./storageProvider";
import registerProviders from "../../registerProviders";
import { AssetType } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";
jest.mock("@azure/storage-blob");
import { TokenCredential, AnonymousCredential,
    ContainerURL, StorageURL, ServiceURL, Credential, Aborter,
    BlobURL, BlockBlobURL } from "@azure/storage-blob";

describe("Azure blob functions", () => {

    let provider: AzureCloudStorageService = null;
    const options = MockFactory.azureOptions();
    const blobName = "blob1.jpg";
    const serviceURL = ServiceURL as jest.Mocked<typeof ServiceURL>
    const containerURL = ContainerURL as jest.Mocked<typeof ContainerURL>
    const blockBlobURL = BlockBlobURL as jest.Mocked<typeof BlockBlobURL>

    registerProviders();

    beforeEach(() => {
        provider = new AzureCloudStorageService(options);
    });

    it("readText", () => {
        provider.readText(blobName);
    });

    it("readBinary", () => {

    });
    
    it("writeText", () => {

    });

    it("deleteFile", () => {

    });

    it("listContainers", () => {

    });

    it("createContainer", () => {

    });

    it("deleteContainer", () => {

    });

    it("getAssets", () => {

    });

    
});
