import { cleanup, draw, getCanvas, getContext, options, reset, start, stop } from "../src/gl";

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

            it ( "should fix delta time when recording", ( done: MochaDone ) => {
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

        } );
    } );

}
