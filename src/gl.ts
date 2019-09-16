import JSZip from "jszip";
import { bindAll } from "lodash";

import { BaseRecorder, colorToRGBA, Settings } from "./shared";

export class Recorder extends BaseRecorder<WebGLRenderingContext> {

    get gl(): WebGLRenderingContext {
        return this.context;
    }

    constructor() {
        const canvas = document.createElement( "canvas" );
        const context: WebGLRenderingContext = (
            canvas.getContext( "webgl" ) ||
            canvas.getContext( "experimental-webgl" )
        )! as WebGLRenderingContext;

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
        this.context = (
            canvas.getContext( "webgl" ) ||
            canvas.getContext( "experimental-webgl" )
        )! as WebGLRenderingContext;
    }
}

export const recorder = new Recorder();

bindAll( recorder, [
    "getCanvas",
    "getContext",
    "options",
    "start",
    "stop",
    "cleanup",
    "reset",
    "draw",
    "setup",
    "bootstrap",
    "addFrame",
    "resetBundle",
    "downloadBundle",
    "getBundle",
] );

const getCanvas = recorder.getCanvas;
const getContext = recorder.getContext;
const options = recorder.options;
const start = recorder.start;
const stop = recorder.stop;
const cleanup = recorder.cleanup;
const reset = recorder.reset;
const draw = recorder.draw;
const setup = recorder.setup;
const bootstrap = recorder.bootstrap;
const addFrame = recorder.addFrame;
const resetBundle = recorder.resetBundle;
const downloadBundle = recorder.downloadBundle;
const getBundle = recorder.getBundle;

export default recorder;
export {
    getCanvas,
    getContext,
    options,
    start,
    stop,
    cleanup,
    reset,
    draw,
    setup,
    bootstrap,
    addFrame,
    resetBundle,
    downloadBundle,
    getBundle,
    JSZip,
};
