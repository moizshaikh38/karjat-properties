import { JWTPayload } from './user';

declare global {
  namespace Express {
    export interface Request {
      user?: JWTPayload;
    }
  }
}
