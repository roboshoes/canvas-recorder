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
    .option( "-k, --format <format>", "The file format generated: mp4 or gif. Default is mp4" )
    .parse( process.argv );


/**
 * Returns the value of a given flag, and falls back to the a given default if flag is not
 * specified. An optional array of white listed values can restrict the value
 *
 * @param {string} name            Value of the flag
 * @param {string} defaultValue    Default value to be returned if flag not found
 * @param {string[]=} restrictions Optional. Array of allowed values
 *
 * @throws If restrictions are given and the value is not listed, the method throws and error
 */
function valueOrDefault( name, defaultValue, restrictions ) {
    const value = program[ name ];

    if ( !value ) {
        return defaultValue;
    }

    if ( restrictions && restrictions.indexOf( value ) < 0 ) {
        throw new Error( name + " has to be one of: " + restrictions.join ( ", " ) );
    }

    return value;
}

/**
 * Creates FFMPEG command based on input options.
 *
 * @param {Object} options Settings to determine the
 * @param {string} options.format Output format either "mp4" or "gif";
 * @param {number} options.fps The frames per second used for both input as well as output
 * @param {number} options.output Name of the file used as output.
 *
 * @returns {string[]} Output command as an array of strings.
 */
function getCommand( options ) {
    switch ( options.format ) {
        case "mp4":
            return [
                `-framerate ${ options.fps }`,
                "-i %06d.png",
                "-c:v libx264",
                "-pix_fmt yuv420p",
                options.output,
            ];
        case "gif":
            return [
                "-f image2",
                `-framerate ${ options.fps }`,
                "-i %06d.png",
                `-r ${ options.fps }`,
                options.output,
            ];
        default:
            return [];
    }
}

exec( "ffmpeg -version", function( error, _, stderr ) {
    if ( error || stderr ) {
        console.warn(
            "Error: canvas-recorder requires ffmpeg to be installed and accessable view `ffmpeg` command. " +
            "See: https://ffmpeg.org/"
        );

        return;
    }

    const options = {};

    try {

        options.format = valueOrDefault( "format", "mp4", [ "mp4", "gif" ] );
        options.fps = valueOrDefault( "fps", 30 );
        options.output = valueOrDefault( "output", "out." + options.format );
        options.input = valueOrDefault( "input", "." );

    } catch( error ) {
        return console.error( error.message );
    }

    const spawnOptions = {
        stdio: "inherit",
        shell: true,
        cwd: options.input,
    }

    const spawnFlags = getCommand( options );

    if ( !spawnFlags ) {
        console.error( "Something went wrong. canvas-recorder didn't understand the command." );
        return;
    }

    spawn( "ffmpeg", spawnFlags, spawnOptions );
} );
