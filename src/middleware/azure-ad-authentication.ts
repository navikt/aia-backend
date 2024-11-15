import { NextFunction, Request, RequestHandler, Response } from 'express';
import logger from '../logger';
import { validateAzureToken } from '@navikt/oasis';

const azureAdAuthentication: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const bearerToken = req.header('Authorization');

    if (bearerToken) {
        const validationResult = await validateAzureToken(bearerToken);
        if (validationResult.ok) {
            next();
            return;
        } else {
            logger.error(validationResult.error, `Feil med azure token-validering: ${validationResult.errorType}`);
        }
    } else {
        logger.error(`Feil med azure token-validering: ingen token i header`);
    }

    res.status(401).end();
};

export default azureAdAuthentication;
