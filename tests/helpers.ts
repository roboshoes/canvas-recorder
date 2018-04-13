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
