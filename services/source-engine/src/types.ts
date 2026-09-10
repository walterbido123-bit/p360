export type SourceKind="rss"|"api"|"webhook"|"sports_api";
export type SourceTier="primary"|"high"|"standard"|"unverified";
export type SourceConfig={id:string;name:string;kind:SourceKind;url:string;publisher:string;desk:string;geography:string;tier:SourceTier;enabled:boolean;pollMinutes:number};
export type RawItem={sourceId:string;title:string;url:string;summary?:string;publishedAt?:string;author?:string;externalId?:string;raw?:unknown};
export type NormalizedItem={id:string;sourceId:string;publisher:string;headline:string;canonicalUrl:string;summary:string;publishedAt:string|null;author:string|null;desk:string;geography:string;sourceTier:SourceTier;sourceScore:number;fingerprint:string;ingestedAt:string};
