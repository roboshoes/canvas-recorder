import { saveAs } from "file-saver";
import JSZip from "jszip";
import { assign, bindAll, padStart } from "lodash";

export interface Settings {
    record: boolean;
    clear: boolean;
    size: [ number, number ];
    frames: number;
    onComplete: (blob: Blob) => void;
    color: string;
    fps: number;
}

export type DrawingFunction = ( context: CanvasRenderingContext2D, time: number ) => void;
export type DrawOptions = Partial<Settings>;

export class Recorder {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private callback?: DrawingFunction;
    private teardown?: () => void;
    private count = 0;
    private startTime = 0;
    private raf: number = 0;
    private isLooping = false;
    private zip?: JSZip;

    private readonly settings: Settings = {
        record: true,
        clear: false,
        size: [ 1024, 1024 ],
        frames: -1,
        onComplete: download,
        color: "white",
        fps: 60,
    };

    constructor() {
        this.canvas = document.createElement( "canvas" );
        this.context = this.canvas.getContext( "2d" )!;

        bindAll( this, [ "loop" ] );
    }

    public options( opts: DrawOptions ) {
        if ( this.isLooping ) {
            throw new Error( "Options can not be set while animation is in progress." );
        }

        assign( this.settings, opts );
        this.setup();
    }

    public start() {
        if (!this.callback) {
            throw new Error( "A drawing routine has to be provided using `draw( ( context, delta ) => void )`." );
        }

        this.setup();

        this.isLooping = true;
        this.startTime = Date.now();

        this.loop();
    }

    public stop() {
        this.isLooping = false;
        cancelAnimationFrame( this.raf );

        if ( this.teardown ) this.teardown();

        if ( this.settings.record && this.zip && this.count > 0 ) {
            this.zip.generateAsync( { type: "blob" } ).then( this.settings.onComplete );
        }
    }

    public reset() {
        this.isLooping = false;
        cancelAnimationFrame( this.raf );

        this.settings.record = true;
        this.settings.clear = false;
        this.settings.size = [ 1024, 1024 ];
        this.settings.frames = -1;
        this.settings.onComplete = download;
        this.settings.color = "white";

        this.callback = undefined;
        this.teardown = undefined;

        this.setup();
    }

    public draw( action: DrawingFunction ) {
        this.callback = action;
    }

    public cleanup( action: () => void ) {
        this.teardown = action;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    public getContext(): CanvasRenderingContext2D {
        return this.context;
    }

    private setup() {
        this.canvas.width = this.settings.size[ 0 ];
        this.canvas.height = this.settings.size[ 1 ];

        this.context.fillStyle = this.settings.color;
        this.context.fillRect( 0, 0, this.settings.size[ 0 ], this.settings.size[ 1 ] );

        this.zip = new JSZip();
        this.count = 0;
    }

    private loop() {
        if ( !this.isLooping ) return;

        const delta = this.settings.record ? this.count * ( 1000 / this.settings.fps ) : Date.now() - this.startTime;

        if ( this.settings.clear ) {
            this.context.fillStyle = this.settings.color;
            this.context.fillRect( 0, 0, this.settings.size[ 0 ], this.settings.size[ 1 ] );
        }

        this.callback!( this.context, delta );
        this.count++;

        if ( this.settings.record ) {
            record( this.canvas, this.count - 1, this.zip! ).then( () => {
                if ( this.count >= this.settings.frames && this.settings.frames > 0 ) stop();
                else if ( this.isLooping ) this.nextFrame();
            } );
        } else if ( this.settings.frames > 0 && this.count >= this.settings.frames ) {
            stop();
        } else {
            this.nextFrame();
        }
    }

    private nextFrame() {
        cancelAnimationFrame( this.raf );
        this.raf = requestAnimationFrame( this.loop );
    }
}


function download( blob: Blob ) {
    saveAs( blob, "frames.zip" );
}

function record( canvas: HTMLCanvasElement, frame: number, zip: JSZip ): Promise<void> {
    return new Promise<void>( resolve => {
        canvas.toBlob( ( blob: Blob | null ) => {

            const name = `${ padStart( frame.toString(), 6, "0" ) }.png`;
            zip.file( name, blob!, { base64: true } );
            resolve();

        }, "image/png" );
    } );
}

/**
 * For ease of use we make a bound version of the recorder available.
 */
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
