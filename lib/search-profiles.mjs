import {OBJECTIVE_DESCRIPTION} from './search-objective.mjs';
export const SEARCH_PROFILES={chat:{numResults:5,highlights:true},voice:{numResults:4,highlights:true},plan:{numResults:10,highlights:true}};
export function searchVariables(mode){const profile=SEARCH_PROFILES[mode];if(!profile)throw new Error('Unknown search profile');return {search_result_count:profile.numResults};}
export function configureSearchTool(config){
 const updated=structuredClone(config),schema=updated.api_schema.request_body_schema;
 schema.properties.numResults={type:'integer',dynamic_variable:'search_result_count'};
 schema.properties.contents.properties.highlights={type:'boolean',constant_value:true};
 schema.properties.objective={type:'string',description:OBJECTIVE_DESCRIPTION};
 schema.properties.userLocation={type:'object',description:'Copy the search_location session value. Include both coordinates only when supplied; never invent coordinates.',properties:{country:{type:'string',dynamic_variable:'country'},latitude:{type:'number',description:'Latitude from search_location, otherwise omit.'},longitude:{type:'number',description:'Longitude from search_location, otherwise omit.'}},required:['country']};
 schema.properties.query={...schema.properties.query,description:'Search question. Include the known neighbourhood/city and country as location context for nearby searches, even when coordinates are supplied in userLocation. Preserve explicit requested destinations over device location. Never invent a location.'};
 schema.required=[...new Set([...schema.required,'userLocation','objective'])];
 updated.dynamic_variables={dynamic_variable_placeholders:{...updated.dynamic_variables?.dynamic_variable_placeholders,...searchVariables('voice'),country:'SG'}};
 delete updated.dynamic_variables.dynamic_variable_placeholders.search_highlight_characters;
 return updated;
}

export const LOCATION_PROMPT='Search location JSON: {{search_location}}. Copy supplied latitude and longitude together into web_search.userLocation; omit both if absent, never guess. Always include the known neighbourhood/city and country in nearby search query text, including when coordinates exist. Preserve explicit requested destinations over device location; never invent missing location text.';
