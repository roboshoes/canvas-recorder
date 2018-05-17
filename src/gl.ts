import { bindAll } from "lodash";

import { BaseRecorder, colorToRGBA, Settings } from "./shared";

export class Recorder extends BaseRecorder<WebGLRenderingContext> {

    get gl(): WebGLRenderingContext {
        return this.context;
    }

    constructor() {
        const canvas = document.createElement( "canvas" );
        const context = ( canvas.getContext( "webgl" ) || canvas.getContext( "experimental-webgl" ) )!;

        super( canvas, context );
    }

    public options( opts: Partial<Settings> ) {
        super.options( opts );

        const [ r, g, b, a ] = colorToRGBA( this.settings.color );
        this.gl.clearColor( r, g, b, a );
    }

    protected clear() {
        this.gl.clear( this.gl.COLOR_BUFFER_BIT );
    }

    protected updateCanvas( canvas: HTMLCanvasElement ) {
        this.canvas = canvas;
        this.context = ( canvas.getContext( "webgl" ) || canvas.getContext( "experimental-webgl" ) )!;
    }
}

export const recorder = new Recorder();

bindAll( recorder, [ "getCanvas", "getContext", "options", "start", "stop", "cleanup", "reset", "draw", "setup" ] );

const getCanvas = recorder.getCanvas;
const getContext = recorder.getContext;
const options = recorder.options;
const start = recorder.start;
const stop = recorder.stop;
const cleanup = recorder.cleanup;
const reset = recorder.reset;
const draw = recorder.draw;
const setup = recorder.setup;

export default recorder;
export { getCanvas, getContext, options, start, stop, cleanup, reset, draw, setup };
