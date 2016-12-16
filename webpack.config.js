var UglifyJsPlugin = require("webpack/lib/optimize/UglifyJsPlugin");
var DedupePlugin = require("webpack/lib/optimize/DedupePlugin");
var ProgressPlugin = require("webpack/lib/ProgressPlugin");
var AssetsPlugin = require("assets-webpack-plugin");
var BellOnBundlerErrorPlugin = require('bell-on-bundler-error-plugin');

// Function which returns an Object which is the webpack config options.
//
// @options:
//   {
//     production: bool (false)
//     watch: bool (false)
//   }
module.exports = function (options) {

  var PLUGINS = {

    dedupe: new DedupePlugin(),

    writeStats: new AssetsPlugin({
      filename: "webpack-assets.json",
      fullPath: false
    }),

    uglify: new UglifyJsPlugin({
      compress: {
        warnings: true
      }
    }),

    bellOnError: new BellOnBundlerErrorPlugin(),

    progress: new ProgressPlugin(function handler(percentage, msg) {
      var done = percentage >= 1;

      if (process.stdout.isTTY) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
      }

      if (msg) msg = " (" + msg + ")";
      process.stdout.write("Webpack progress: " + Math.round(percentage * 100) + "%" + msg);

      if (!process.stdout.isTTY || done) {
        process.stdout.write("\r\n");
      }
    })

  }

  var plugins = [];

  if (options.production) {
    plugins.push(PLUGINS.uglify);
    // File size of output "with" vs "without" dedupe is not different, so let's not waste cycles.
    // plugins.push(PLUGINS.dedupe);
  }
  else {
    plugins.push(PLUGINS.bellOnError);
    plugins.push(PLUGINS.progress);
  }

  plugins.push(PLUGINS.writeStats);

  return {
    context: __dirname + "/assets/javascripts",
    resolve: { extensions: ["", ".js", ".jsx", ".json", ".css"] },
    watch: options.watch || false,
    // entry: {
    //   Entries are supplied by gulp + vinyl-named package.
    // },
    output: {
      filename: "[name].js",
      sourceMapFilename: "[name].js.map"
    },
    devtool: "source-map",
    module: {
      loaders: [
        {
          test: /\.jsx?$/,
          loader: "babel-loader",
          exclude: /node_modules/,
          query: {
            presets: ["es2015", "react"]
          }
        },
        {
          test: /\.json$/,
          loader: "json-loader"
        },
        {
          test: /\.css$/,
          loader:"style-loader!css-loader"
        }
      ]
    },
    plugins: plugins
  };
};
