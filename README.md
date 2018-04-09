= Canvas Recorder =

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
