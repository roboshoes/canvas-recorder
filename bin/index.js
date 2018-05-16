#! /usr/bin/env node
const program = require( "commander" );
const path = require( "path" );
const { exec, spawn } = require( "child_process" );

program
    .version( "1.0.0" )
    .usage( "[options]" )
    .option( "-i, --input <dir>", "Directory containing the image sequence." )
    .option( "-o, --output <name>", "Name of the output file. Defaults to out.mp4." )
    .option( "-r, --fps <num>", "The framerate at which the sequence should play. Default is 30." )
    .parse( process.argv );


exec( "ffmpeg -version", function( error, stdout, stderr ) {
    if ( error || stderr ) {
        console.warn(
            "Error: canvas-recorder requires ffmpeg to be installed and accessable view `ffmpeg` command. " +
            "See: https://ffmpeg.org/"
        );

        return;
    }

    const fps = program.fps || 30;
    const output = program.output || "out.mp4";
    const input = program.input || ".";

    spawn( "ffmpeg", [
        "-i %06d.png",
        `-framerate ${ fps }`,
        `-r ${ fps }`,
        "-c:v libx264",
        `-vf "fps=${ fps },format=yuv420p"`,
        output,
    ], {
        stdio: "inherit",
        shell: true,
        cwd: input,
    } );
} );
