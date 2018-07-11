module.exports = function( config ) {
    config.set( {
        basePath: "",
        frameworks: [ "mocha", "expect" ],
        files: [
            "dist/tests/bundle.js"
        ],
        exclude: [],
        preprocessors: {},
        reporters: [ "mocha" ],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: [ "ChromeHeadlessNoSandbox" ],
        singleRun: true,
        concurrency: Infinity,
        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: "ChromeHeadless",
                flags: [ "--no-sandbox" ]
            }
        }
    } );
};
