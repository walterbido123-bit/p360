export type SourceKind="rss"|"api"|"webhook"|"sports_api";
export type SourceTier="primary"|"high"|"standard"|"unverified";
export type SourceConfig={id:string;name:string;kind:SourceKind;url:string;publisher:string;desk:string;geography:string;tier:SourceTier;enabled:boolean;pollMinutes:number};
export type ExtractionMetadata={status:"complete"|"summary_only"|"failed";fetchedAt:string;contentCharacters:number;error?:string};
export type RawItem={sourceId:string;title:string;url:string;summary?:string;content?:string;publishedAt?:string;author?:string;authors?:string[];credits?:string[];externalId?:string;extraction?:ExtractionMetadata;raw?:unknown};
export type NormalizedItem={id:string;sourceId:string;publisher:string;headline:string;canonicalUrl:string;summary:string;content:string;publishedAt:string|null;author:string|null;authors:string[];credits:string[];desk:string;geography:string;sourceTier:SourceTier;sourceScore:number;fingerprint:string;extraction:ExtractionMetadata|null;ingestedAt:string};
