// Repair only tables with an explicit Markdown separator row. Never guess
// columns from ordinary prose containing pipes, or alter fenced code blocks.
export function normalizeAnswerMarkdown(text) {
 const lines=text.split(/\r?\n/),output=[];
 let fence=null,columns=0;
 const pipes=line=>[...line.matchAll(/(?<!\\)\|/g)].map(m=>m.index);
 for(let i=0;i<lines.length;i++){
  let line=lines[i];
  const marker=/^\s*(`{3,}|~{3,})/.exec(line);
  if(marker){if(!fence)fence=marker[1];else if(marker[1][0]===fence[0]&&marker[1].length>=fence.length)fence=null;columns=0;output.push(line);continue;}
  if(fence){output.push(line);continue;}
  const separator=lines[i+1]?.trim();
  if(separator && /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$/.test(separator)){
   const count=separator.replace(/^\|/,'').replace(/\|$/,'').split('|').length;
   const positions=pipes(line);
   if(line.trimEnd().endsWith('|')&&positions.length===count+1){
    const start=positions[0],prefix=line.slice(0,start).trimEnd();
    if(prefix)output.push(prefix,'');
    line=line.slice(start);
    columns=count;
    output.push(line,lines[++i]);
    continue;
   }
  }
  if(columns){
   const positions=pipes(line);
   if(line.trimStart().startsWith('|')&&positions.length===columns+1){
    const end=positions.at(-1)+1,suffix=line.slice(end).trim();
    output.push(line.slice(0,end));
    if(suffix){output.push('',suffix);columns=0;}
    continue;
   }
   columns=0;
  }
  output.push(line);
 }
 return output.join('\n');
}
