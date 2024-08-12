import { BaseContext } from '@apollo/server';

export interface ResolverContextType extends BaseContext {
    token: string;
}
