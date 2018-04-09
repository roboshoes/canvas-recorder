import { saveAs } from "file-saver";
import JSZip from "jszip";
import { padStart, assign } from "lodash";

const canvas = document.createElement( "canvas" );
const context = canvas.getContext( "2d" )!;

let callback: DrawingFunction | undefined;
let teardown: Function | undefined;
let startTime: number;
let isLooping = false;
let zip: JSZip;
let count = 0;
let raf: number;


export type DrawingFunction = ( context: CanvasRenderingContext2D, time: number ) => void;
export type DrawOptions = Partial<Settings>;

export interface Settings {
    record: boolean;
    clear: boolean;
    size: [ number, number ];
    frames: number,
    onComplete: (blob: Blob) => void;
    color: string;
}

const settings: Settings = {
    record: true,
    clear: false,
    size: [ 1024, 1024 ] as [ number, number ],
    frames: -1,
    onComplete: download,
    color: "white"
};

export function reset() {
    isLooping = false;
    cancelAnimationFrame( raf );

    settings.record = true;
    settings.clear = false;
    settings.size = [ 1024, 1024 ];
    settings.frames = -1;
    settings.onComplete = download;
    settings.color = "white";

    callback = undefined;
    teardown = undefined;

    setup();
}

export function getCanvas(): HTMLCanvasElement {
    return canvas;
}

export function getContext(): CanvasRenderingContext2D {
    return context;
}

export function draw( action: DrawingFunction ) {
    callback = action;
}

export function cleanup( action: () => void ) {
    teardown = action;
}

export function start() {
    if (!callback) {
        throw new Error( 'A drawing routine has to be provided using `draw( ( context, delta ) => void )`.' );
    }

    setup();

    isLooping = true;
    startTime = Date.now();

    loop();
}

export function options( opts: DrawOptions ) {
    if ( isLooping ) {
        throw new Error( "Options can not be set while animation is in progress." );
    }

    assign( settings, opts );
    setup();
}

export function stop() {
    isLooping = false;
    cancelAnimationFrame( raf );

    if ( teardown ) teardown();

    if ( settings.record && count > 0 ) {
        zip.generateAsync( { type: "blob" } ).then( settings.onComplete );
    }
}

function setup() {
    canvas.width = settings.size[ 0 ];
    canvas.height = settings.size[ 1 ];

    context.fillStyle = settings.color;
    context.fillRect( 0, 0, settings.size[ 0 ], settings.size[ 1 ] );

    zip = new JSZip();
    count = 0;
}

function download( blob: Blob ) {
    saveAs( blob, "frames.zip" );
}

function loop() {
    if ( !isLooping ) return;

    const delta = Date.now() - startTime;

    if ( settings.clear ) {
        context.fillStyle = settings.color;
        context.fillRect( 0, 0, settings.size[ 0 ], settings.size[ 1 ] );
    }

    callback!( context, delta );

    count++;

    if ( settings.record ) {
        record( count - 1 ).then( () => {
            if ( count >= settings.frames && settings.frames > 0 ) stop();
            else if ( isLooping ) nextFrame( loop );
        } );
    } else if ( settings.frames > 0 && count >= settings.frames ) {
        stop();
    } else {
        nextFrame( loop );
    }
}

function nextFrame( callback: FrameRequestCallback ) {
    cancelAnimationFrame( raf );
    raf = requestAnimationFrame( callback );
}

function record( frame: number ): Promise<void> {
    return new Promise( ( resolve: Function ) => {
        canvas.toBlob( ( blob: Blob | null ) => {

            const name = `${ padStart( frame.toString(), 6, '0' ) }.png`;
            zip.file( name, blob!, { base64: true } );
            resolve();

        }, 'image/png' );
    } );
}
