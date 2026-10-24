import {MapPin,ArrowUpRight} from 'lucide-react';
import {mapShortcuts,mapsUrl} from '@/lib/map-shortcuts.mjs';
export type MapPlace={name:string;address?:string};
export default function MapShortcuts({answer,places,query}:{answer:string;places?:MapPlace[];query:string}){
 const links=mapShortcuts(answer,places,query);if(!links.length)return null;
 return <div className="map-shortcuts" aria-label="Google Maps shortcuts">{links.map(link=><a key={link.query} href={mapsUrl(link.query)} target="_blank" rel="noopener noreferrer" title={link.name} aria-label={`Open ${link.name} in Google Maps`}><MapPin size={15}/><span>{link.name.replace(/\s+(?:Bakery|Restaurant|Café|Cafe)$/i,'')||link.name}</span><ArrowUpRight size={13}/></a>)}</div>;
}
