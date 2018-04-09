import { saveAs } from "file-saver";
import JSZip from "jszip";
import { padStart, defaults } from "lodash";

const canvas = document.createElement( "canvas" );
const context = canvas.getContext( "2d" )!;

let callback: DrawingFunction;
let startTime: number;
let isLooping = false;
let zip: JSZip;
let count = 0;


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

const settings = {
    record: true,
    clear: false,
    size: [ 1024, 1024 ] as [ number, number ],
    frames: -1,
    onComplete: download,
    color: "white"
};

export function getCanvas(): HTMLCanvasElement {
    return canvas;
}

export function getContext(): CanvasRenderingContext2D {
    return context;
}

export function draw( action: DrawingFunction ) {
    callback = action;
}

export function start() {
    if (!callback) {
        throw new Error( 'A drawing routine has to be provided using `draw( ( context, delta ) => void )`.' );
    }

    canvas.width = settings.size[ 0 ];
    canvas.height = settings.size[ 1 ];

    context.fillStyle = settings.color;
    context.fillRect( 0, 0, settings.size[ 0 ], settings.size[ 1 ] );

    startTime = Date.now();
    isLooping = true;
    zip = new JSZip();
    count = 0;

    loop();
}

export function options( opts: DrawOptions ) {
    if ( isLooping ) {
        throw new Error( "Options can not be set while animation is in progress." );
    }

    defaults( settings, opts );
}

export function stop() {
    isLooping = false;

    if ( settings.record ) {
        zip.generateAsync( { type: "blob" } ).then( settings.onComplete );
    }
}

function download( blob: Blob ) {
    saveAs( blob, "frames.zip" );
}

function loop() {
    const delta = Date.now() - startTime;

    if ( settings.clear ) context.clearRect( 0, 0, settings.size[ 0 ], settings.size[ 1 ] );

    callback( context, delta );

    if ( settings.record ) {
        record( count ).then( () => {
            count++;

            if ( count > settings.frames && settings.frames > 0 ) stop();
            if ( isLooping ) requestAnimationFrame( loop );
        } );
    } else {
        if ( isLooping ) requestAnimationFrame( loop );
    }
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