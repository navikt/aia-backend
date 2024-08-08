/* eslint-disable */
import { GraphQLResolveInfo } from 'graphql';
import { ResolverContextType } from './resolverTypes';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: { input: string; output: string };
    String: { input: string; output: string };
    Boolean: { input: boolean; output: boolean };
    Int: { input: number; output: number };
    Float: { input: number; output: number };
};

export type Annet = {
    __typename?: 'Annet';
    andreForholdHindrerArbeid: Maybe<Scalars['String']['output']>;
};

export type ArbeidssokerPeriode = {
    __typename?: 'ArbeidssokerPeriode';
    avsluttet: Maybe<ArbeidssokerperiodeMetadata>;
    opplysninger: Maybe<Array<Maybe<Opplysninger>>>;
    periodeId: Scalars['String']['output'];
    profilering: Maybe<Array<Maybe<Profilering>>>;
    startet: Maybe<ArbeidssokerperiodeMetadata>;
};

export type ArbeidssokerperiodeMetadata = {
    __typename?: 'ArbeidssokerperiodeMetadata';
    aarsak: Maybe<Scalars['String']['output']>;
    kilde: Maybe<Scalars['String']['output']>;
    tidspunkt: Maybe<Scalars['String']['output']>;
    utfoertAv: Maybe<ArbeidssokerperiodeUtfoertAv>;
};

export type ArbeidssokerperiodeUtfoertAv = {
    __typename?: 'ArbeidssokerperiodeUtfoertAv';
    type: Scalars['String']['output'];
};

export type Helse = {
    __typename?: 'Helse';
    helsetilstandHindrerArbeid: Maybe<Scalars['String']['output']>;
};

export type Jobbsituasjon = {
    __typename?: 'Jobbsituasjon';
    beskrivelse: Maybe<Scalars['String']['output']>;
    detaljer: Maybe<JobbsituasjonDetaljer>;
};

export type JobbsituasjonDetaljer = {
    __typename?: 'JobbsituasjonDetaljer';
    gjelder_fra_dato_iso8601: Maybe<Scalars['String']['output']>;
    gjelder_til_dato_iso8601: Maybe<Scalars['String']['output']>;
    prosent: Maybe<Scalars['String']['output']>;
    siste_arbeidsdag_iso8601: Maybe<Scalars['String']['output']>;
    siste_dag_med_loenn_iso8601: Maybe<Scalars['String']['output']>;
    stilling: Maybe<Scalars['String']['output']>;
    stilling_styrk08: Maybe<Scalars['String']['output']>;
};

export type Opplysninger = {
    __typename?: 'Opplysninger';
    annet: Maybe<Annet>;
    helse: Maybe<Helse>;
    jobbsituasjon: Maybe<Array<Maybe<Jobbsituasjon>>>;
    opplysningerOmArbeidssoekerId: Scalars['String']['output'];
    periodeId: Scalars['String']['output'];
    sendtInnAv: Maybe<SendtInnAv>;
    utdanning: Maybe<Utdanning>;
};

export type Profilering = {
    __typename?: 'Profilering';
    alder: Maybe<Scalars['Int']['output']>;
    jobbetSammenhengendeSeksAvTolvSisteManeder: Maybe<Scalars['Boolean']['output']>;
    opplysningerOmArbeidssoekerId: Maybe<Scalars['String']['output']>;
    periodeId: Scalars['String']['output'];
    profileringId: Maybe<Scalars['String']['output']>;
    profilertTil: Maybe<Scalars['String']['output']>;
    sendtInnAv: Maybe<SendtInnAv>;
};

export type Query = {
    __typename?: 'Query';
    perioder: Maybe<Array<Maybe<ArbeidssokerPeriode>>>;
};

export type SendtInnAv = {
    __typename?: 'SendtInnAv';
    aarsak: Maybe<Scalars['String']['output']>;
    kilde: Maybe<Scalars['String']['output']>;
    tidspunkt: Maybe<Scalars['String']['output']>;
    utfoertAv: Maybe<UtfoertAv>;
};

export type Utdanning = {
    __typename?: 'Utdanning';
    bestaatt: Maybe<Scalars['String']['output']>;
    godkjent: Maybe<Scalars['String']['output']>;
    nus: Scalars['String']['output'];
};

export type UtfoertAv = {
    __typename?: 'UtfoertAv';
    id: Maybe<Scalars['String']['output']>;
    type: Maybe<Scalars['String']['output']>;
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
    resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
    | ResolverFn<TResult, TParent, TContext, TArgs>
    | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
    subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
    resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
    subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
    resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
    | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
    | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
    | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
    | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
    parent: TParent,
    context: TContext,
    info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
    obj: T,
    context: TContext,
    info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
    next: NextResolverFn<TResult>,
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
    Annet: ResolverTypeWrapper<Annet>;
    ArbeidssokerPeriode: ResolverTypeWrapper<ArbeidssokerPeriode>;
    ArbeidssokerperiodeMetadata: ResolverTypeWrapper<ArbeidssokerperiodeMetadata>;
    ArbeidssokerperiodeUtfoertAv: ResolverTypeWrapper<ArbeidssokerperiodeUtfoertAv>;
    Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
    Helse: ResolverTypeWrapper<Helse>;
    Int: ResolverTypeWrapper<Scalars['Int']['output']>;
    Jobbsituasjon: ResolverTypeWrapper<Jobbsituasjon>;
    JobbsituasjonDetaljer: ResolverTypeWrapper<JobbsituasjonDetaljer>;
    Opplysninger: ResolverTypeWrapper<Opplysninger>;
    Profilering: ResolverTypeWrapper<Profilering>;
    Query: ResolverTypeWrapper<{}>;
    SendtInnAv: ResolverTypeWrapper<SendtInnAv>;
    String: ResolverTypeWrapper<Scalars['String']['output']>;
    Utdanning: ResolverTypeWrapper<Utdanning>;
    UtfoertAv: ResolverTypeWrapper<UtfoertAv>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
    Annet: Annet;
    ArbeidssokerPeriode: ArbeidssokerPeriode;
    ArbeidssokerperiodeMetadata: ArbeidssokerperiodeMetadata;
    ArbeidssokerperiodeUtfoertAv: ArbeidssokerperiodeUtfoertAv;
    Boolean: Scalars['Boolean']['output'];
    Helse: Helse;
    Int: Scalars['Int']['output'];
    Jobbsituasjon: Jobbsituasjon;
    JobbsituasjonDetaljer: JobbsituasjonDetaljer;
    Opplysninger: Opplysninger;
    Profilering: Profilering;
    Query: {};
    SendtInnAv: SendtInnAv;
    String: Scalars['String']['output'];
    Utdanning: Utdanning;
    UtfoertAv: UtfoertAv;
}>;

export type AnnetResolvers<
    ContextType = ResolverContextType,
    ParentType extends ResolversParentTypes['Annet'] = ResolversParentTypes['Annet'],
> = ResolversObject<{
    andreForholdHindrerArbeid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ArbeidssokerPeriodeResolvers<
    ContextType = ResolverContextType,
    ParentType extends ResolversParentTypes['ArbeidssokerPeriode'] = ResolversParentTypes['ArbeidssokerPeriode'],
> = ResolversObject<{
    avsluttet?: Resolver<Maybe<ResolversTypes['ArbeidssokerperiodeMetadata']>, ParentType, ContextType>;
    opplysninger?: Resolver<Maybe<Array<Maybe<ResolversTypes['Opplysninger']>>>, ParentType, ContextType>;
    periodeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    profilering?: Resolver<Maybe<Array<Maybe<ResolversTypes['Profilering']>>>, ParentType, ContextType>;
    startet?: Resolver<Maybe<ResolversTypes['ArbeidssokerperiodeMetadata']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ArbeidssokerperiodeMetadataResolvers<
    ContextType = ResolverContextType,
    ParentType extends
        ResolversParentTypes['ArbeidssokerperiodeMetadata'] = ResolversParentTypes['ArbeidssokerperiodeMetadata'],
> = ResolversObject<{
    aarsak?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    kilde?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    tidspunkt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    utfoertAv?: Resolver<Maybe<ResolversTypes['ArbeidssokerperiodeUtfoertAv']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ArbeidssokerperiodeUtfoertAvResolvers<
    ContextType = ResolverContextType,
    ParentType extends
        ResolversParentTypes['ArbeidssokerperiodeUtfoertAv'] = ResolversParentTypes['ArbeidssokerperiodeUtfoertAv'],
> = ResolversObject<{
    type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HelseResolvers<
    ContextType = ResolverContextType,
    ParentType extends ResolversParentTypes['Helse'] = ResolversParentTypes['Helse'],
> = ResolversObject<{
    helsetilstandHindrerArbeid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type JobbsituasjonResolvers<
    ContextType = ResolverContextType,
    ParentType extends ResolversParentTypes['Jobbsituasjon'] = ResolversParentTypes['Jobbsituasjon'],
> = ResolversObject<{
    beskrivelse?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    detaljer?: Resolver<Maybe<ResolversTypes['JobbsituasjonDetaljer']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type JobbsituasjonDetaljerResolvers<
    ContextType = ResolverContextType,
    ParentType extends ResolversParentTypes['JobbsituasjonDetaljer'] = ResolversParentTypes['JobbsituasjonDetaljer'],
> = ResolversObject<{
    gjelder_fra_dato_iso8601?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    gjelder_til_dato_iso8601?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    prosent?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    siste_arbeidsdag_iso8601?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    siste_dag_med_loenn_iso8601?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    stilling?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    stilling_styrk08?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OpplysningerResolvers<
    ContextType = ResolverContextType,
    ParentType extends ResolversParentTypes['Opplysninger'] = ResolversParentTypes['Opplysninger'],
> = ResolversObject<{
    annet?: Resolver<Maybe<ResolversTypes['Annet']>, ParentType, ContextType>;
    helse?: Resolver<Maybe<ResolversTypes['Helse']>, ParentType, ContextType>;
    jobbsituasjon?: Resolver<Maybe<Array<Maybe<ResolversTypes['Jobbsituasjon']>>>, ParentType, ContextType>;
    opplysningerOmArbeidssoekerId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    periodeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    sendtInnAv?: Resolver<Maybe<ResolversTypes['SendtInnAv']>, ParentType, ContextType>;
    utdanning?: Resolver<Maybe<ResolversTypes['Utdanning']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProfileringResolvers<
    ContextType = ResolverContextType,
    ParentType extends ResolversParentTypes['Profilering'] = ResolversParentTypes['Profilering'],
> = ResolversObject<{
    alder?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
    jobbetSammenhengendeSeksAvTolvSisteManeder?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
    opplysningerOmArbeidssoekerId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    periodeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    profileringId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    profilertTil?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    sendtInnAv?: Resolver<Maybe<ResolversTypes['SendtInnAv']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<
    ContextType = ResolverContextType,
    ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query'],
> = ResolversObject<{
    perioder?: Resolver<Maybe<Array<Maybe<ResolversTypes['ArbeidssokerPeriode']>>>, ParentType, ContextType>;
}>;

export type SendtInnAvResolvers<
    ContextType = ResolverContextType,
    ParentType extends ResolversParentTypes['SendtInnAv'] = ResolversParentTypes['SendtInnAv'],
> = ResolversObject<{
    aarsak?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    kilde?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    tidspunkt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    utfoertAv?: Resolver<Maybe<ResolversTypes['UtfoertAv']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UtdanningResolvers<
    ContextType = ResolverContextType,
    ParentType extends ResolversParentTypes['Utdanning'] = ResolversParentTypes['Utdanning'],
> = ResolversObject<{
    bestaatt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    godkjent?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    nus?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UtfoertAvResolvers<
    ContextType = ResolverContextType,
    ParentType extends ResolversParentTypes['UtfoertAv'] = ResolversParentTypes['UtfoertAv'],
> = ResolversObject<{
    id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = ResolverContextType> = ResolversObject<{
    Annet?: AnnetResolvers<ContextType>;
    ArbeidssokerPeriode?: ArbeidssokerPeriodeResolvers<ContextType>;
    ArbeidssokerperiodeMetadata?: ArbeidssokerperiodeMetadataResolvers<ContextType>;
    ArbeidssokerperiodeUtfoertAv?: ArbeidssokerperiodeUtfoertAvResolvers<ContextType>;
    Helse?: HelseResolvers<ContextType>;
    Jobbsituasjon?: JobbsituasjonResolvers<ContextType>;
    JobbsituasjonDetaljer?: JobbsituasjonDetaljerResolvers<ContextType>;
    Opplysninger?: OpplysningerResolvers<ContextType>;
    Profilering?: ProfileringResolvers<ContextType>;
    Query?: QueryResolvers<ContextType>;
    SendtInnAv?: SendtInnAvResolvers<ContextType>;
    Utdanning?: UtdanningResolvers<ContextType>;
    UtfoertAv?: UtfoertAvResolvers<ContextType>;
}>;
