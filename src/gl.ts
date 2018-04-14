import { BaseRecorder, colorToRGBA, Settings } from "./shared";

export class Recorder  extends BaseRecorder<WebGLRenderingContext> {

    get gl(): WebGLRenderingContext {
        return this.context;
    }

    constructor() {
        const canvas = document.createElement( "canvas" );
        const context = ( canvas.getContext( "webgl" ) || canvas.getContext( "experimental-webgl" ) )!;

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
}
