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
- `fps`: [Default: `60`] The framerate at from which the elapsed time is calculated in record mode. Not that the
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

### `cleanup( () => {} )`
This is a utility that can be used as a callback after the recording has terminated. This is especially useful when the
recorder is used in frame mode. After the desired amount of frames this method will be called. Once this method is
called all resources can be used freely and won't no longer be used by the recorder.

### `getCanvas(): HTMLCanvasElement`
Returns the canvas being used by the recorder.

### `getContext(): CanvasRenderingContext2D`
Returns the context attached to the canvas of the recorder.
