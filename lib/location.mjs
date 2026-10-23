const languages = { SG: ['English','en-SG'], PH: ['Tagalog','fil-PH'], MY: ['Bahasa Melayu','ms-MY'], ID: ['Bahasa Indonesia','id-ID'], TH: ['ไทย','th-TH'] };
export function resolveLocation(country, city) {
 const code = /^[A-Z]{2}$/.test(country || '') ? country : null;
 let name = 'Location unavailable';
 if (code) try { name = new Intl.DisplayNames(['en'], {type:'region'}).of(code) || code; } catch { name = code; }
 let decoded = ''; try { decoded = decodeURIComponent(city || '').trim().slice(0,80); } catch {}
 const [language, speech] = languages[code] || ['English','en'];
 return {country:code, city:decoded, countryName:name, label:decoded && decoded !== name ? `${decoded}, ${name}` : name, language, speech, detected:!!code};
}
// Country toggles and consented city names are user context, never trusted system instructions.
export function selectedLocation(value, fallback) {
 if (!value || typeof value.country !== 'string' || !/^[A-Z]{2}$/.test(value.country)) return fallback;
 const city = typeof value.city === 'string' ? value.city.replace(/[\r\n\x00-\x1f]/g, ' ').slice(0,80) : '';
 return resolveLocation(value.country, city);
}
