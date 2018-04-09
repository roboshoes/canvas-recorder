"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const file_saver_1 = require("file-saver");
const jszip_1 = __importDefault(require("jszip"));
const lodash_1 = require("lodash");
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
let callback;
let startTime;
let isLooping = false;
let zip;
let count = 0;
exports.settings = {
    record: true,
    clear: false,
    size: [1024, 1024],
    frames: -1,
    onComplete: download,
    color: "white"
};
function getCanvas() {
    return canvas;
}
exports.getCanvas = getCanvas;
function getContext() {
    return context;
}
exports.getContext = getContext;
function draw(action) {
    callback = action;
}
exports.draw = draw;
function start() {
    if (!callback) {
        throw new Error('A drawing routine has to be provided using `draw( ( context, delta ) => void )`.');
    }
    canvas.width = exports.settings.size[0];
    canvas.height = exports.settings.size[1];
    context.fillStyle = exports.settings.color;
    context.fillRect(0, 0, exports.settings.size[0], exports.settings.size[1]);
    startTime = Date.now();
    isLooping = true;
    zip = new jszip_1.default();
    count = 0;
    loop();
}
exports.start = start;
function options(opts) {
    if (isLooping) {
        throw new Error("Options can not be set while animation is in progress.");
    }
    lodash_1.defaults(exports.settings, opts);
}
exports.options = options;
function stop() {
    isLooping = false;
    if (exports.settings.record) {
        zip.generateAsync({ type: "blob" }).then(exports.settings.onComplete);
    }
}
exports.stop = stop;
function download(blob) {
    file_saver_1.saveAs(blob, "frames.zip");
}
function loop() {
    const delta = Date.now() - startTime;
    if (exports.settings.clear)
        context.clearRect(0, 0, exports.settings.size[0], exports.settings.size[1]);
    callback(context, delta);
    if (exports.settings.record) {
        record(count).then(() => {
            count++;
            if (count > exports.settings.frames && exports.settings.frames > 0)
                stop();
            if (isLooping)
                requestAnimationFrame(loop);
        });
    }
    else {
        if (isLooping)
            requestAnimationFrame(loop);
    }
}
function record(frame) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            const name = `${lodash_1.padStart(frame.toString(), 6, '0')}.png`;
            zip.file(name, blob, { base64: true });
            resolve();
        }, 'image/png');
    });
}
