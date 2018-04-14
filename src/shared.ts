import JSZip from "jszip";
import { assign, bindAll, memoize, padStart } from "lodash";

export interface Settings {
    record: boolean;
    clear: boolean;
    size: [ number, number ];
    frames: number;
    onComplete: (blob: Blob) => void;
    color: string;
    fps: number;
}

export type DrawOptions = Partial<Settings>;

export class BaseRecorder<T extends CanvasRenderingContext2D | WebGLRenderingContext> {
    protected callback?: ( context: T, time: number ) => void;
    protected teardown?: () => void;
    protected count = 0;
    protected startTime = 0;
    protected raf: number = 0;
    protected isLooping = false;
    protected zip?: JSZip;

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

    public draw( action: ( context: T, time: number ) => void ) {
        this.callback = action;
    }

    public cleanup( action: () => void ) {
        this.teardown = action;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    public getContext(): T {
        return this.context;
    }

    protected clear() {
        throw new Error( "Method not implemented" );
    }

    private setup() {
        this.canvas.width = this.settings.size[ 0 ];
        this.canvas.height = this.settings.size[ 1 ];

        this.clear();

        this.zip = new JSZip();
        this.count = 0;
    }

    private loop() {
        if ( !this.isLooping ) return;

        const delta = this.settings.record ? this.count * ( 1000 / this.settings.fps ) : Date.now() - this.startTime;

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

export function colorToRGBA( color: string ): [ number, number, number, number ] {
    return strictColorToRGBA( color ) as [ number, number, number, number ];
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
