import { bindAll } from "lodash";

import { BaseRecorder, DrawOptions, Settings } from "./shared";

export { Settings, DrawOptions };

export class Recorder extends BaseRecorder<CanvasRenderingContext2D> {
    constructor() {
        const canvas = document.createElement( "canvas" );
        const context = canvas.getContext( "2d" )!;

        super( canvas, context );
    }

    protected clear() {
        this.context.fillStyle = this.settings.color;
        this.context.fillRect( 0, 0, this.settings.size[ 0 ], this.settings.size[ 1 ] );
    }

    protected updateCanvas( canvas: HTMLCanvasElement ) {
        this.canvas = canvas;
        this.context = canvas.getContext( "2d" )!;
    }
}


// For ease of use we make a bound version of the recorder available.
const recorder = new Recorder();

bindAll( recorder, [ "getCanvas", "getContext", "options", "start", "stop", "cleanup", "reset", "draw" ] );

const getCanvas = recorder.getCanvas;
const getContext = recorder.getContext;
const options = recorder.options;
const start = recorder.start;
const stop = recorder.stop;
const cleanup = recorder.cleanup;
const reset = recorder.reset;
const draw = recorder.draw;

export default recorder;
export { getCanvas, getContext, options, start, stop, cleanup, reset, draw };
