import { TokenResult } from '@navikt/oasis';

type TexasTokenResponse = {
    access_token: string;
    expires_in: number;
    token_type: string;
};

async function requestOboToken(
    token: string,
    audience: string,
    identityProvider: 'tokenx' | 'azuread',
): Promise<TokenResult> {
    try {
        const response = await fetch(`${process.env.NAIS_TOKEN_EXCHANGE_ENDPOINT}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({
                identity_provider: identityProvider,
                target: audience,
                user_token: token,
            }),
        });

        if (response.ok) {
            const data = (await response.json()) as TexasTokenResponse;
            return {
                ok: true,
                token: data.access_token,
            };
        }
        return {
            ok: false,
            error: new Error(response.statusText),
        };
    } catch (error) {
        return { ok: false, error: error as Error };
    }
}

export async function requestTexasOboToken(token: string, audience: string) {
    return requestOboToken(token, audience, 'tokenx');
}

export async function requestTexasAzureOboToken(token: string, audience: string) {
    return requestOboToken(token, audience, 'azuread');
}
