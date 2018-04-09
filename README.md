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

### `options`
Used to set some basic settings.

- `record`: [Default: `true`] Enables/Disables the recording of all frames.
- `clear`: [Default: `false`] Clears the previous frame on every draw call.,
- `size`: [Default: `[1024, 1024]`] Sets the size of the canvas.
- `frames`: [Default: `-1`] Determines the amount of frames recorded. If set to `-1` it will continue recording until
                            a call to `stop()`.
- `onComplete`: [Default `<internal>`] Function that is called when all frames are recorded and archived into a zip in
                                       form of a `Blob`. When not set, a download is triggered automatically.
- `color`: [Default: `"white"`] Sets the background color of every frame if `clear` is set to `true`.

