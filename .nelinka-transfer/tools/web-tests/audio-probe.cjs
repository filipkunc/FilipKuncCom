// Observe the real WebAudio graph without replacing playback or game logic.
module.exports = async page => page.addInitScript(() => {
  window.audioPlays = [];
  const start = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function(...args) {
    if (this.buffer && this.buffer.length > 1) {
      const data = this.buffer.getChannelData(0);
      let signature=2166136261;
      for(let i=0;i<data.length;i+=13) signature=Math.imul(signature ^ Math.round(data[i]*32767),16777619)>>>0;
      let peak = 0;
      for (let i=0;i<data.length;i++) peak=Math.max(peak,Math.abs(data[i]));
      window.audioPlays.push({signature, duration:this.buffer.duration, rate:this.buffer.sampleRate, peak, state:this.context.state});
    }
    return start.apply(this,args);
  };
});
