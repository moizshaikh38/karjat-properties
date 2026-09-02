import 'express';

declare module 'multer' {
  import { RequestHandler } from 'express';

  namespace multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }

    interface StorageEngine {
      _handleFile(req: any, file: File, callback: (error?: any, info?: Partial<File>) => void): void;
      _removeFile(req: any, file: File, callback: (error: Error | null) => void): void;
    }

    interface Options {
      dest?: string;
      storage?: StorageEngine;
      limits?: {
        fieldNameSize?: number;
        fieldSize?: number;
        fields?: number;
        fileSize?: number;
        files?: number;
        parts?: number;
        headerPairs?: number;
      };
      fileFilter?(req: any, file: File, callback: (error: Error | null, acceptFile?: boolean) => void): void;
    }

    interface Instance {
      single(fieldname: string): RequestHandler;
      array(fieldname: string, maxCount?: number): RequestHandler;
      fields(fields: Array<{ name: string; maxCount?: number }>): RequestHandler;
      none(): RequestHandler;
      any(): RequestHandler;
    }

    function memoryStorage(): StorageEngine;
    function diskStorage(options?: {
      destination?: string | ((req: any, file: File, cb: (error: Error | null, destination: string) => void) => void);
      filename?: (req: any, file: File, cb: (error: Error | null, filename: string) => void) => void;
    }): StorageEngine;
  }

  function multer(options?: multer.Options): multer.Instance;

  export = multer;
}

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }

    interface Request {
      file?: Multer.File;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
    }
  }
}
