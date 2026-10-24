const normalize = value => value.toLocaleLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function mapShortcuts(answer, places = [], query = '') {
 const text=normalize(answer), seen=new Set();
 const matches=places.filter(place=>{
  if(typeof place?.name!=='string'||!place.name.trim())return false;
  const name=normalize(place.name);if(!text.includes(name)||seen.has(name))return false;
  seen.add(name);return true;
 }).slice(0,3).map(place=>({name:place.name,query:[place.name,place.address].filter(Boolean).join(', ')}));
 if(matches.length)return matches;
 // Plain prose from article results may not include structured place entities.
 // Recognize explicit café/restaurant names as Maps *searches*, never listing IDs.
 if(/\b(brunch|restaurant|cafe|café|food near|coffee shop|places to eat)\b/i.test(query)){
  const word="[\\p{Lu}][\\p{L}\\p{N}'’.-]*";
  const named=new RegExp(`(?:${word}(?:\\s+(?:&|and))?\\s+){1,5}(?:Bakery|Cafe|Café|Restaurant|Bistro|Coffee|Kitchen)|(?:Kafe|Cafe|Café|Restaurant|Bistro)\\s+${word}(?:\\s+${word}){0,2}`,'gu');
  const names=[...new Set((answer.match(named)||[]).map(name=>name.trim()))].slice(0,3);
  const region=query.match(/\b(Singapore|Kuala Lumpur|Bangsar|Penang|Bangkok|Jakarta|Manila|Cebu|Malaysia|Thailand|Indonesia|Philippines)\b/gi)?.join(', ')||'';
  if(names.length)return names.map(name=>({name,query:[name,region].filter(Boolean).join(', ')}));
 }
 // Older saved replies without recognizable names retain a general search.
 if(/\b(brunch|restaurant|cafe|café|food near|coffee shop|places to eat)\b/i.test(query))return [{name:'Find on Google Maps',query}];
 return [];
}
export function mapsUrl(query) {
 const url=new URL('https://www.google.com/maps/search/');url.searchParams.set('api','1');url.searchParams.set('query',query.slice(0,500));return url.href;
}
