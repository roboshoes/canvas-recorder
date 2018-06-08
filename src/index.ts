import JSZip from "jszip";
import { bindAll } from "lodash";

import { BaseRecorder, download, DrawOptions, record, Settings } from "./shared";

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

/**
 * Bundle of utilities to use just the recording without any other featuers. This is usefaul
 * when working with a setup that is not compatible with the options/draw configuration of
 * canvas-recorder.
 */

let bundle = new JSZip();
let count = 0;

export function addFrame( canvas: HTMLCanvasElement ): Promise<void> {
    return record( canvas, count++, bundle );
}

export function getBundle(): JSZip {
    return bundle;
}

export function resetBundle(): void {
    bundle = new JSZip();
    count = 0;
}

/**
 * Download the current bundle of frames. This will also reset the bundle to a new empty one.
 * All further frames will not be included but can be downloaded subsequently.
 */
export function downloadBundle(): Promise<void> {
    return bundle.generateAsync( { type: "blob" } )
        .then( download )
        .then( () => {
            count = 0;
            bundle = new JSZip();
        } );
}

// For ease of use we make a bound version of the recorder available.
const recorder = new Recorder();

bindAll( recorder, [ "getCanvas", "getContext", "options", "start", "stop", "cleanup", "reset", "draw", "bootstrap" ] );

const getCanvas = recorder.getCanvas;
const getContext = recorder.getContext;
const options = recorder.options;
const start = recorder.start;
const stop = recorder.stop;
const cleanup = recorder.cleanup;
const reset = recorder.reset;
const draw = recorder.draw;
const bootstrap = recorder.bootstrap;

export default recorder;
export { getCanvas, getContext, options, start, stop, cleanup, reset, draw, bootstrap };
