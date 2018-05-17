import triangle from "a-big-triangle";
import createShader from "gl-shader";
import JSZip from "jszip";

import { cleanup, draw, getCanvas, getContext, options, reset, setup, start, stop } from "../src/gl";
import { base64ToImage, imageToCanvas } from "./helpers";

export function specs() {

    describe( "canvas-recorder/gl", () => {

        it( "should return a canvas", () => {
            expect( getCanvas() instanceof HTMLCanvasElement ).to.be( true );
        } );

        it( "should return a webgl context", () => {
            expect( getContext() instanceof WebGLRenderingContext ).to.be( true );
            expect( getContext().canvas ).to.be( getCanvas() );
        } );

        describe( "options", () => {
            beforeEach( () => {
                reset();
            } );

            it( "should set canvas to correct size", () => {
                options( {
                    size: [ 300, 500 ],
                } );

                const canvas = getCanvas();

                expect( canvas.width ).to.be( 300 );
                expect( canvas.height ).to.be( 500 );
            } );

            it( "should call draw 3 times", ( done: MochaDone ) => {
                let count = 0;

                options( {
                    frames: 3,
                    record: false,
                } );

                draw( () => {
                    count++;
                } );

                cleanup( () => {
                    expect( count ).to.be( 3 );
                    done();
                } );

                start();
            } );

            it( "should throw when changing options while animating", () => {
                options( {
                    record: false,
                } );

                draw( () => {} );
                start();

                expect( () => options( { color: "green" } ) ).to.throwError();

                stop();
            } );

            it( "should fix delta time when recording", ( done: MochaDone ) => {
                options( {
                    fps: 10,
                    onComplete: () => {},
                } );

                let count = 0;

                draw( ( _ , delta: number ) => {
                    expect( delta ).to.be( count * 100 );

                    if ( ++count > 10 ) {
                        stop();
                        done();
                    }
                } );

                start();
            } );

            it( "should set a given canvas", ( done: MochaDone ) => {
                const canvas = document.createElement( "canvas" );
                const context = canvas.getContext( "webgl" )! || canvas.getContext( "experimental-webgl" )!;

                expect( getCanvas() ).not.to.be( canvas );

                options( {
                    record: false,
                    size: [ 30, 40 ],
                    canvas,
                } );

                expect( getCanvas() ).to.be( canvas );
                expect( getContext() ).to.be( context );

                draw( ( c: WebGLRenderingContext ) => {
                    expect( c ).to.be( context );

                    done();
                    stop();
                } );

                start();

                expect( canvas.width ).to.be( 30 );
                expect( canvas.height ).to.be( 40 );
            } );

        } );

        describe( "zip", () => {

            beforeEach( () => {
                reset();
            } );

            it( "should recieve a zip as blob", ( done: MochaDone ) => {
                options( {
                    frames: 2,
                    onComplete: ( blob: Blob ) => {
                        expect( blob instanceof Blob ).to.be( true );
                        expect( blob.type ).to.be( "application/zip" );
                        done();
                    },
                } );

                draw( ( gl: WebGLRenderingContext ) => {
                    triangle( gl );
                } );

                start();
            } );

            it( "should create a red frame", ( done: MochaDone ) => {

                let shader: ReturnType<typeof createShader>;

                options( {
                    frames: 1,
                    size: [ 10, 10 ],
                    onComplete: ( blob: Blob ) => {
                        JSZip.loadAsync( blob )
                            .then( ( zip: JSZip ) => zip.file( "000000.png" ).async( "base64" ) )
                            .then( base64ToImage )
                            .then( imageToCanvas )
                            .then( ( canvas: HTMLCanvasElement ) => {
                                expect( canvas.width ).to.be( 10 );
                                expect( canvas.height ).to.be( 10 );

                                const context = canvas.getContext( "2d" )!;
                                const data = context.getImageData( 0, 0, 10, 10 ).data;

                                for ( let i = 0; i < data.length; i += 4 ) {
                                    expect( data[ i ] ).to.be( 255 );
                                    expect( data[ i + 1 ] ).to.be( 0 );
                                    expect( data[ i + 2 ] ).to.be( 0 );
                                    expect( data[ i + 3 ] ).to.be( 255 );
                                }

                                done();
                            } );
                    },
                } );

                setup( ( gl: WebGLRenderingContext ) => {
                    shader = createShader(
                        gl,
                        `
                            precision mediump float;
                            attribute vec2 position;

                            varying vec2 uv;

                            void main() {
                                uv = position.xy;
                                gl_Position = vec4( position.xy, 0.0, 1.0 );
                            }
                        `,
                        `
                            precision mediump float;
                            varying vec2 uv;
                            void main() {
                                gl_FragColor = vec4( 1, 0, 0, 1 );
                            }
                        `,
                    );
                } );

                draw( ( gl: WebGLRenderingContext ) => {

                    shader.bind();

                    triangle( gl );
                } );

                start();
            } );

        } );

    } );

}
