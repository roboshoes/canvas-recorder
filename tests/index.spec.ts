import { cleanup, draw, getCanvas, getContext, options, reset, start, stop } from "../src";

describe( "canvas-recorder", () => {

    it( "should return a canvas element", () => {
        expect( getCanvas() instanceof HTMLCanvasElement ).to.be( true );
    } );

    it( "should return a drawing context", () => {
        expect( getContext() instanceof CanvasRenderingContext2D ).to.be( true );
        expect( getContext().canvas ).to.be( getCanvas() );
        expect( getCanvas().getContext( "2d" ) ).to.be( getContext() );
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

        it( "should set the clear color to black", () => {
            options( {
                color: "black",
                clear: true,
                record: false,
            } );

            draw( ( context ) => {
                const data =  context.getImageData( 0, 0, 1, 1 ).data;

                expect( data[ 0 ] ).to.be( 0 );
                expect( data[ 1 ] ).to.be( 0 );
                expect( data[ 2 ] ).to.be( 0 );
                expect( data[ 3 ] ).to.be( 255 );

                stop();
            } );

            start();
        } );

        it( "should clear the previous content", ( done: MochaDone ) => {

            let count = 0;

            options( {
                clear: true,
                record: false,
            } );

            draw( ( context ) => {
                const data =  context.getImageData( 0, 0, 1, 1 ).data;

                expect( data[ 0 ] ).to.be( 255 );
                expect( data[ 1 ] ).to.be( 255 );
                expect( data[ 2 ] ).to.be( 255 );
                expect( data[ 3 ] ).to.be( 255 );

                context.fillStyle = "green";
                context.fillRect( 0, 0, 1, 1 );

                count++;

                if ( count > 2 ) {
                    stop();
                    done();
                }
            } );

            start();
        } );

        it( "should not clear the previous canvas", ( done: MochaDone ) => {
            let count = 0;

            options( {
                clear: false,
                record: false,
            } );

            draw( ( context ) => {
                const data =  context.getImageData( 0, 0, 1, 1 ).data;

                if ( count > 0 ) {
                    expect( data[ 0 ] ).to.be( 0 );
                    expect( data[ 1 ] ).to.be( 255 );
                    expect( data[ 2 ] ).to.be( 0 );
                    expect( data[ 3 ] ).to.be( 255 );
                }

                context.fillStyle = "rgb( 0, 255, 0 )";
                context.fillRect( 0, 0, 1, 1 );

                count++;

                if ( count > 2 ) {
                    stop();
                    done();
                }
            } );

            start();
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
