export interface DocumentStoragePort {
    uploadDocument(key: string, body: Buffer | string, contentType: string): Promise<string>;
    getDocumentUrl(key: string): Promise<string>;
}
