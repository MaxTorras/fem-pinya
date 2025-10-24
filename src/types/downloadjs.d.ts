declare module 'downloadjs' {
  type DownloadableData = Blob | string | ArrayBuffer | Uint8Array;

  function download(data: DownloadableData, filename?: string, mimeType?: string): void;

  export default download;
}
