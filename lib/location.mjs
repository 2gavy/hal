const languages = { SG: ['English','en-SG'], PH: ['Tagalog','fil-PH'], MY: ['Bahasa Melayu','ms-MY'], ID: ['Bahasa Indonesia','id-ID'], TH: ['ไทย','th-TH'] };
/**
 * @param {string|null} [city]
 * @param {{latitude?:number,longitude?:number}|null} [coordinates]
 */
export function resolveLocation(country, city = '', coordinates = null) {
 const code = /^[A-Z]{2}$/.test(country || '') ? country : null;
 let name = 'Location unavailable';
 if (code) try { name = new Intl.DisplayNames(['en'], {type:'region'}).of(code) || code; } catch { name = code; }
 let decoded = ''; try { decoded = decodeURIComponent(city || '').trim().slice(0,80); } catch {}
 const [language, speech] = languages[code] || ['English','en'];
 return {country:code, city:decoded, countryName:name, label:decoded && decoded !== name ? `${decoded}, ${name}` : name, language, speech, detected:!!code, ...validCoordinates(coordinates)};
}
// Country toggles and consented city names are user context, never trusted system instructions.
export function selectedLocation(value, fallback) {
 if (!value || typeof value.country !== 'string' || !/^[A-Z]{2}$/.test(value.country)) return fallback;
 const city = typeof value.city === 'string' ? value.city.replace(/[\r\n\x00-\x1f]/g, ' ').slice(0,80) : '';
 return resolveLocation(value.country, city, value);
}

// Keep a pair or neither; never turn missing/invalid values into (0, 0).
export function validCoordinates(value) {
 const {latitude,longitude}=value||{};
 if(typeof latitude!=='number'||typeof longitude!=='number'||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)return {};
 return {latitude:Math.round(latitude*10000)/10000,longitude:Math.round(longitude*10000)/10000};
}
export function exaUserLocation(location) {
 const coordinates=validCoordinates(location);
 return 'latitude' in coordinates ? {...(location.country?{country:location.country}:{}),...coordinates} : location.country || undefined;
}
export function locationVariables(location) {
 const value=exaUserLocation(location);
 return {search_location:JSON.stringify(typeof value==='string'?{country:value}:value||{})};
}
