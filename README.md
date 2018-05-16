# Canvas Recorder

> A blatant ripoff of [Looper](https://github.com/spite/looper)

This is a small utility to record a canvas based animation of any sort. The tool can be used to
run the animation in the browser until one is ready to record it. The setup works around four
core methods depicted in the code below:

```js
import { options, start, draw, getCanvas } from "canvas-recorder";

options( {
    size: [ 500, 500 ],
    frames: 30
} );

draw( ( context, delta ) => {

    // ... Do something here

} );

document.body.appendChild( getCanvas() );

start();
```

Additionally, `canvas-recorder` can also be used as a command line tool to merge the image sequence into
a MP4 file format. [See here](#cli-tool)

_Note: The package is written in Typescript and ships with types. Use in JS or TS alike._

## Methods

### `options( settings: {} )`
Used to set settings for the recording. In most cases calling options will be done before any frames are recorded as a
first step of the program. Calling options while in between `start()` and `stop()` (while it is recording) calls is not
permitted.

It takes one argument which is an object with the following possible settings:

- `record`: [Default: `true`] Enables/Disables the recording of all frames. Setting this to `false` is useful in
                              development. Not recording any frames significantly speeds up the drawing cycles.
- `clear`: [Default: `false`] Clears the previous frame on every draw call.,
- `size`: [Default: `[1024, 1024]`] Sets the size of the canvas.
- `frames`: [Default: `-1`] Determines the amount of frames recorded. If set to `-1` it will continue recording until
                            a call to `stop()`.
- `onComplete`: [Default `<internal>`] Function that is called when all frames are recorded and archived into a zip in
                                       form of a `Blob`. When not set, a download is triggered automatically.
- `color`: [Default: `"white"`] Sets the background color of every frame if `clear` is set to `true`.
- `fps`: [Default: `60`] The framerate from which the elapsed time is calculated in record mode. Note that the
                         recording won't happen in at this pace as it is no longer realtime.

### `draw( ( context, time ) => {} )`
The draw method is the heart of the recorder. It takes on argument which is a callback. This callback will recieve two
arguments at every invocation:
- `context` which is a `CanvasRenderingContext2D` associated with the Canvas. This context is generally used to draw
  the frame.
- `time` is the amount of milliseconds since the most recent `start` call. Using this `time` argument allows for the
async recording to adhere to the animations fluidity. Do not calculate the time yourself, as the recording process is
much slower than the desired framerate.

### `start()`
Calling this will start the loop of the recorder.

### `stop()`
Will terminate the loop. If the settings are set to `record: true`, calling `stop` will subsequently finalize all
recorded frames and compress them in a ZIP archive. By default this ZIP will trigger a download to save all frames,
unless `onComplete` is set with a costum function. If so, said function will recieve the ZIP in form of a `Blob`.

### `setup( ( context ) => {} )`
This method will be called right before the frist draw call. The context is passed. This is especially useful in the
WebGL implementation.

### `cleanup( () => {} )`
This is a utility that can be used as a callback after the recording has terminated. This is especially useful when the
recorder is used in frame mode. After the desired amount of frames this method will be called. Once this method is
called all resources can be used freely and won't no longer be used by the recorder.

### `getCanvas(): HTMLCanvasElement`
Returns the canvas being used by the recorder.

### `getContext(): CanvasRenderingContext2D`
Returns the context attached to the canvas of the recorder.

### `Recorder`
All methods are simply a shorthand for an instance of a `Recorder`. If one would rather instantiate the recorder
themselves, maybe to run multiple recorders at once, do it like so:

```ts
import { Recorder } from "canvas-recorder";

const recorder = new Recorder();

recorder.options( {
    ...
} );

recorder.draw( ( context: CanvasRenderingContext2D, time: number ) => {
    ...
} );

recorder.start();
```

## WebGL

The package is also avialble with webgl support. The API is quasi identical. In order to use it as a WebGL package
change the import slightly

```typescript
import triangle from "a-big-triangle";
import createShader from "gl-shader";
import { options, start, draw, getCanvas, setup } from "canvas-recorder/gl";

let shader;

options( {
    frames: 10,
    size: [ 100, 100 ]
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
```

### Context
In this implementation, the context is always a `WebGLRenderingContext` instead of a `CanvasRenderingContext2D`.


## Cli Tool

Tool to turn the image sequence into a movei format.

When installed globally, or through the use of a package.json, one can invoke the command `canvas-recorder` or
alternatively use the alias `ffmpy` (pronounced: _effeffempey_) as a shorter command.

Unsurprisingly uses FFmpeg under the hood. It has a limited amount of possible options but sets defaults for all
of them. Therefore the easiest usecase is calling the command in the directory of the image sequence with not flags

### Flags
- `-i, --input <dir>` Path to the folder of the image sequence. Defaults to `.`.
- `-r, --fps <num>` Framerate used in the movie file. Defaults to `30`.
- `-o, --output <name>` File name of the output. Defaults to `out.mp4`.


### Setup
When installed globally, the commands are available everywhere. Alternatively, when installed locally in
the project it can still be executed from the package.json

```json
"scripts": {
    "merge": "canvas-recorder -i ./image-sequence/ -o film.mp4"
}
```