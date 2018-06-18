import { saveAs } from "file-saver";
import JSZip from "jszip";
import { assign, bindAll, memoize, padStart } from "lodash";

/**
 * Complete set of options.
 */
export interface Settings {
    record: boolean;
    clear: boolean;
    size: [ number, number ];
    frames: number;
    onComplete: (blob: Blob) => void;
    color: string;
    fps: number;
    canvas?: HTMLCanvasElement;
}

/**
 * Interface to descrive the possible settings when set in an `options()` call.
 */
export type DrawOptions = Partial<Settings>;

/**
 * Abstract base class that implements shared internal functionality to record a canvas was animation frame by frame.
 */
export abstract class BaseRecorder<T extends CanvasRenderingContext2D | WebGLRenderingContext> {
    protected callback?: ( context: T, time: number ) => void;
    protected teardown?: () => void;
    protected before?: ( context: T ) => void;
    protected count = 0;
    protected startTime = 0;
    protected raf: number = 0;
    protected isLooping = false;
    protected zip?: JSZip;

    /**
     * State of settings currently in use. For more detail please refer to the README.
     */
    protected readonly settings: Settings = {
        record: true,
        clear: false,
        size: [ 1024, 1024 ],
        frames: -1,
        onComplete: download,
        color: "white",
        fps: 60,
    };

    constructor( protected canvas: HTMLCanvasElement, protected context: T ) {
        bindAll( this, [ "loop" ] );
    }

    /**
     * Sets specific details on how the recorder functions.
     *
     * @param opts settings for recording behavior
     */
    public options( opts: DrawOptions ) {
        if ( this.isLooping ) {
            throw new Error( "Options can not be set while animation is in progress." );
        }

        if ( opts.canvas ) {
            this.updateCanvas( opts.canvas );
        }

        assign( this.settings, opts );
        this.init();
    }

    /**
     * Starts a recording. This will create an asyncronous loop that continously calls the draw function until the
     * recorder is either manually stopped or automatically terminated after reaching and amount of desired frames.
     *
     * Once the recording was started, options can not be changed.
     */
    public start() {
        if (!this.callback) {
            throw new Error( "A drawing routine has to be provided using `draw( ( context, delta ) => void )`." );
        }

        this.init();

        this.isLooping = true;
        this.startTime = Date.now();

        if ( this.before ) this.before( this.context );
        this.loop();
    }

    /**
     * Stops the recording process. When a desired amount of frames is set, this method is not needed as it is
     * invoked internally.
     * Stopping the recording also starts an asyncrounous routine to finalize the zip file that contains all images.
     * Due to the inherent asyncrounous nature of the process, the stop function has no return value. To recieve the
     * archive instead of downloading it, set the onComplete method in the option.
     */
    public stop() {
        this.isLooping = false;
        cancelAnimationFrame( this.raf );

        if ( this.teardown ) this.teardown();

        if ( this.settings.record && this.zip && this.count > 0 ) {
            this.zip.generateAsync( { type: "blob" } ).then( this.settings.onComplete );
        }
    }

    /**
     * Resets the recorder options to it's originaly state. Terminates any recording if in process. Disposes all
     * currently recorded frames.
     */
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
        this.before = undefined;

        this.init();
    }

    /**
     * Sets the callback used to capture a frame. Repeatedly setting callbacks will overwrite the previous one.
     * Multiple callbacks can not be set. The callback given will recieve the context and the time passed since the
     * start of the recording. Be advised that the time does not represent real time but is dependend on the desired
     * amount of FPD set in the options.
     *
     * @param action callback to capture the animation.
     */
    public draw( action: ( context: T, time: number ) => void ) {
        this.callback = action;
    }

    /**
     * Optinall callback after the animation has terminated. Use this if you need to run some cleanup code after all the
     * animating is done.
     * @param action callback
     */
    public cleanup( action: () => void ) {
        this.teardown = action;
    }

    public setup( action: ( context: T ) => void ) {
        this.before = action;
    }

    /**
     * Returns the canvas html element in use. Useful to inject it into the DOM when in development mode.
     */
    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    /**
     * Returns the context being used. The type depends on the non-abstract implementation of this class.
     */
    public getContext(): T {
        return this.context;
    }

    /**
     * Shorthand to both insert the canvas into the DOM as the last element of the body as
     * well as calling `start()`. Useful for short demos that require no further setup.
     */
    public bootstrap() {
        document.body.appendChild( this.getCanvas() );
        this.start();
    }

    protected abstract clear(): void;

    protected abstract updateCanvas( canvas: HTMLCanvasElement ): void;

    private init() {
        this.canvas.width = this.settings.size[ 0 ];
        this.canvas.height = this.settings.size[ 1 ];

        this.clear();

        this.zip = new JSZip();
        this.count = 0;
    }

    private loop() {
        if ( !this.isLooping ) return;

        const delta = this.settings.record ?
            this.count * ( 1000 / this.settings.fps ) :
            Date.now() - this.startTime;

        if ( this.settings.clear ) {
            this.clear();
        }

        this.callback!( this.context, delta );
        this.count++;

        if ( this.settings.record ) {
            record( this.canvas, this.count - 1, this.zip! ).then( () => {
                if ( this.count >= this.settings.frames && this.settings.frames > 0 ) this.stop();
                else if ( this.isLooping ) this.nextFrame();
            } );
        } else if ( this.settings.frames > 0 && this.count >= this.settings.frames ) {
            this.stop();
        } else {
            this.nextFrame();
        }
    }

    private nextFrame() {
        cancelAnimationFrame( this.raf );
        this.raf = requestAnimationFrame( this.loop );
    }
}

const strictColorToRGBA = memoize( ( color: string ) => {
    const canvas = document.createElement( "canvas" );
    const context = canvas.getContext( "2d" )!;

    canvas.width = 1;
    canvas.height = 1;

    context.fillStyle = color;
    context.fillRect( 0, 0, 1, 1 );

    const data = context.getImageData( 0, 0, 1, 1 ).data;

    return [ data[ 0 ], data[ 1 ], data[ 2 ], data[ 3 ] ];
} );

/**
 * Helper that uses browser internal methods to convert CSS based color string into a RGBA number array.
 * The array returned contains 4 numbers ranging from 0 to 1.
 *
 * @param color Variously formatted color string.
 */
export function colorToRGBA( color: string ): [ number, number, number, number ] {
    return strictColorToRGBA( color ) as [ number, number, number, number ];
}

export function download( blob: Blob ) {
    saveAs( blob, "frames.zip" );
}

export function record( canvas: HTMLCanvasElement, frame: number, zip: JSZip ): Promise<void> {
    return new Promise<void>( resolve => {
        canvas.toBlob( ( blob: Blob | null ) => {

            const name = `${ padStart( frame.toString(), 6, "0" ) }.png`;
            zip.file( name, blob!, { base64: true } );
            resolve();

        }, "image/png" );
    } );
}
