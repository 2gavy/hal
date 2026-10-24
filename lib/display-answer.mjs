// Strip speech delivery cues, while preserving citations and Markdown link labels.
export function displayAnswer(text) {
 return text.replace(/\[(?:helpful|happy|sad|excited|cheerful|friendly|warm|calm|curious|thoughtful|serious|reassuring|empathetic|confident|apologetic|surprised|sarcastic|whispers?|whispering|shouts?|shouting|laughs?|laughing|chuckles?|chuckling|sighs?|sighing|clears throat|short pause|long pause|pause)\](?!\()/gi,'').replace(/^[ \t]+/gm,'').trim();
}
