// A coarse preview locates the first story. Detailed inference only receives its prefix.
export function previewFrames(metadata,interval=4){
 const selected=[];let last=-Infinity;
 for(const frame of metadata){if(frame.seconds-last>=interval){selected.push(frame);last=frame.seconds}}
 if(metadata.length&&selected.at(-1)!==metadata.at(-1))selected.push(metadata.at(-1));
 return selected;
}
export function openingScope(boundary,metadata,transcript){
 if(boundary.status==='no_story')throw Error('opening_no_story');
 const end=boundary.endSeconds,quote=boundary.lastDialogue?.trim();
 if(boundary.status!=='found'||!Number.isFinite(end)||end<=0||end>Math.min(180,metadata.at(-1).seconds+1.1)||!quote)throw Error('opening_boundary_uncertain');
 const pos=transcript.indexOf(quote);
 if(pos<0||transcript.indexOf(quote,pos+1)>=0)throw Error('opening_boundary_uncertain');
 const selected=metadata.filter(f=>f.seconds<end);
 if(!selected.length)throw Error('opening_boundary_uncertain');
 return {metadata:selected,endSeconds:end,transcript:transcript.slice(0,pos+quote.length),reason:boundary.reason};
}
