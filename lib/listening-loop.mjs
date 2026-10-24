// A cancellable hand-off between browser speech playback and recognition.
export function createListeningLoop(listen, schedule=setTimeout, cancel=clearTimeout) {
 let enabled=false, timer;
 return {
  enable(){enabled=true;},
  stop(){enabled=false;if(timer!==undefined)cancel(timer);timer=undefined;},
  resume(){if(timer!==undefined)cancel(timer);if(enabled)timer=schedule(()=>{timer=undefined;if(enabled)listen();},350);},
 };
}
