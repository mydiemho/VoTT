import MockFactory from "../../common/mockFactory";
import registerProviders from "../../registerProviders";
import { AzureCloudStorageService } from "./azureBlobStorage";
jest.mock("@azure/storage-blob");
import { BlockBlobURL, ContainerURL, ServiceURL, Aborter } from "@azure/storage-blob";

describe("Azure blob functions", () => {

    const ad = MockFactory.fakeAzureData();
    const options = ad.options;
    const provider: AzureCloudStorageService = new AzureCloudStorageService(options);

    const serviceURL = ServiceURL as jest.Mocked<typeof ServiceURL>;
    serviceURL.prototype.listContainersSegment = jest.fn(() => Promise.resolve(ad.containers));

    ContainerURL.fromServiceURL = jest.fn(() => new ContainerURL(null, null));
    const containerURL = ContainerURL as jest.Mocked<typeof ContainerURL>;
    containerURL.prototype.delete = jest.fn(() => Promise.resolve());

    BlockBlobURL.fromContainerURL = jest.fn(() => new BlockBlobURL(null, null));
    const blockBlobURL = BlockBlobURL as jest.Mocked<typeof BlockBlobURL>;
    blockBlobURL.prototype.upload = jest.fn(() => Promise.resolve());
    const blob = MockFactory.blob(ad.blobName, ad.blobContent, ad.fileType);
    blockBlobURL.prototype.download = jest.fn(() => Promise.resolve({
        blobBody: Promise.resolve(blob),
    }));

    registerProviders();

    it("Reads the content of a blob", async () => {
        const content = await provider.readText(ad.blobName);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            ad.containerName,
        );
        expect(BlockBlobURL.fromContainerURL).toBeCalledWith(
            expect.any(ContainerURL),
            ad.blobName,
        );
        expect(content).toEqual(ad.blobContent);
    });

    xit("Reads a buffer from a blob", () => {
        throw new Error("not implemented");
    });

    it("Writes the content to a blob", () => {
        provider.writeText(ad.blobName, ad.blobContent);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            ad.containerName,
        );
        expect(BlockBlobURL.fromContainerURL).toBeCalledWith(
            expect.any(ContainerURL),
            ad.blobName,
        );
        expect(blockBlobURL.prototype.upload).toBeCalledWith(
            Aborter.none,
            ad.blobContent,
            ad.blobContent.length,
        );
    });

    xit("Writes a buffer to a blob", () => {
        throw new Error("not implemented");
    });

    it("Deletes a blob within a container", async () => {
        provider.deleteFile(ad.blobName);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            ad.containerName,
        );
        expect(BlockBlobURL.fromContainerURL).toBeCalledWith(
            expect.any(ContainerURL),
            ad.blobName,
        );
        expect(blockBlobURL.prototype.delete).toBeCalledWith(Aborter.none);
    });

    it("Lists the containers within an account", async () => {
        const containers = await provider.listContainers(null);
        expect(serviceURL.prototype.listContainersSegment).toBeCalled();
        expect(containers).toEqual(ad.containers.containerItems.map((element) => element.name));
    });

    it("Creates a container in the account", () => {
        const container = provider.createContainer(null);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            ad.containerName,
        );
        expect(containerURL.prototype.create).toBeCalled();
    });

    it("Deletes a container in the account", () => {
        provider.deleteContainer(null);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            ad.containerName,
        );
        expect(containerURL.prototype.delete).toBeCalled();
    });

    xit("getAssets", () => {
        throw new Error("not implemented");
    });

});
