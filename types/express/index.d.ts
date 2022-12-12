import { Express } from 'express';

declare global {
    namespace Express {
        interface Request {
            locals: {
                idporten: {
                    token: string;
                    user: string;
                    isLevel3: boolean;
                };
            };
        }
    }
}
