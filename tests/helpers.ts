export function base64ToImage( content: string ): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>( ( resolve, reject ) => {
        const image = new Image();

        image.onerror = reject;
        image.onload = () => {
            resolve( image );
        };

        image.src = `data:image/png;base64,${ content }`;
    } );
}

export function imageToCanvas( image: HTMLImageElement ): HTMLCanvasElement {
    const canvas = document.createElement( "canvas" );
    const context = canvas.getContext( "2d" )!;

    canvas.width = image.width;
    canvas.height = image.height;

    context.drawImage( image, 0, 0 );

    return canvas;
}
