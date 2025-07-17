import { TokenResult } from '@navikt/oasis';

type TexasTokenResponse = {
    access_token: string;
    expires_in: number;
    token_type: string;
};

async function requestTexas(url: string, payload: string): Promise<TokenResult> {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
            body: payload,
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

async function requestOboToken(
    token: string,
    audience: string,
    identityProvider: 'tokenx' | 'azuread',
): Promise<TokenResult> {
    return requestTexas(
        `${process.env.NAIS_TOKEN_EXCHANGE_ENDPOINT}`,
        JSON.stringify({
            identity_provider: identityProvider,
            target: audience,
            user_token: token,
        }),
    );
}

export async function requestTexasOboToken(token: string, audience: string) {
    return requestOboToken(token, audience, 'tokenx');
}

export async function requestTexasAzureOboToken(token: string, audience: string) {
    return requestOboToken(token, audience, 'azuread');
}

export function requestTexasAzureM2MToken(audience: string) {
    return requestTexas(
        `${process.env.NAIS_TOKEN_ENDPOINT}`,
        JSON.stringify({
            identity_provider: 'azuread',
            target: audience,
        }),
    );
}
