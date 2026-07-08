// apps/web/public/worklets/brown-noise-processor.js
class BrownNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.lastOut = 0
  }

  process(_inputs, outputs) {
    const output = outputs[0]
    for (let channel = 0; channel < output.length; channel++) {
      const data = output[channel]
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1
        this.lastOut = (this.lastOut + 0.02 * white) / 1.02
        data[i] = this.lastOut * 3.5 // gain-compensate brown noise's natural quietness
      }
    }
    return true
  }
}

registerProcessor('brown-noise-processor', BrownNoiseProcessor)