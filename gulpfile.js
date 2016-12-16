// ---------------------------------------------------------------------
// Packages
// ---------------------------------------------------------------------

var path = require('path')
  , glob = require('glob')
  // , crypto = require('crypto') // TODO: Uncomment if need to use md5 query strings.
  , del = require('del')
  , gulp = require('gulp')
  , less = require('gulp-less')
  , minify = require('gulp-minify-css')
  , cache = require('gulp-cached')
  , progeny = require('gulp-progeny')
  , gutil = require('gulp-util')
  , filter = require('gulp-filter')
  , debug = require('gulp-debug')
  , sourcemaps = require('gulp-sourcemaps')
  , minimist = require('minimist')
  , webpack = require('webpack-stream')
  , named = require('vinyl-named')
  ;

// ---------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------

var webpackConfig = require('./webpack.config.js');

// ---------------------------------------------------------------------
// OPTIONS
// ---------------------------------------------------------------------

var knownOptions = {
  string: ['component']
};

var options = minimist(process.argv.slice(2), knownOptions);

// ---------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------

var ENV = process.env.ENVIRONMENT;

var isProduction = ENV === 'production' || ENV === 'staging';

process.env.NODE_ENV = isProduction ? "production" : "development";

console.log("Gulp: ENVIRONMENT is " + ENV + ".");
console.log("isProduction: " + isProduction);

/*
  Used to determine whether to enable polling in watchify, since the VM
  doesn't get notified of changes from the host OS.

  More info @ http://stackoverflow.com/a/29141649
*/
var ENV_VAGRANT = process.env.ENV_VAGRANT;

var SRC_PATHS = {
  less: './assets/less/',
  scripts: './assets'
};

var BUILD_PATHS = {
  css: './stylesheets/',
  js: './javascript/',
  sourceMaps: './sourcemap/'
};

// ---------------------------------------------------------------------
// TASKS
// ---------------------------------------------------------------------

gulp.task('clean', function() {
  return del.sync([
    path.join(BUILD_PATHS.css, '*.css'),
    path.join(BUILD_PATHS.css, '*.css.map'),
    path.join(BUILD_PATHS.js, '*.js'),
    path.join(BUILD_PATHS.js, '*.js.map'),
    path.join('webpack-assets.json')
  ]);
});

gulp.task('build-js', function () {
  // https://github.com/shama/webpack-stream#multiple-entry-points
  return gulp.src(path.join(SRC_PATHS.scripts, '*.js'))
    .pipe(named())
    .pipe(webpack(webpackConfig({ production: isProduction })))
    .pipe(gulp.dest(BUILD_PATHS.js));
});

var buildCss = function(errorCallback) {
  var stylesheets = glob.sync(path.join(SRC_PATHS.less, '*.less'))
    .map(function(f) {
      return path.basename(f);
    });

  return gulp.src(path.join(SRC_PATHS.less, '**/*.less'))
    .pipe(cache('less'))
    .pipe(progeny())
    .pipe(filter(stylesheets))
    .pipe(sourcemaps.init())
      .pipe(less({ paths: [SRC_PATHS.less] }))
      .on('error', errorCallback)
      .pipe(debug({ title: 'Compiling' }))
    .pipe(sourcemaps.write(BUILD_PATHS.sourceMaps))
    .pipe(gulp.dest(BUILD_PATHS.css));
}

gulp.task('build-css', function() {
  return buildCss(function(err) {
    gutil.log(err.message);
    this.emit('end');
    process.exit(1);
  });
});

// TODO: Support watching only js or only css. Task args?
gulp.task('watch', ['clean'], function() {
  var doCss = function () {
    return buildCss(function(err) {
      gutil.log(err.message);
      this.emit('end');
    });
  }

  doCss();

  gulp.watch(path.join(SRC_PATHS.less, '**/**/*.less'), function(event) {
    return doCss();
  });

  // TODO: Clean js when making new versions. Have to do this in webpack config?
  // Try this one: https://github.com/johnagan/clean-webpack-plugin/issues/25
  return gulp.src(path.join(SRC_PATHS.scripts, '*.js'))
    .pipe(named())
    .pipe(webpack(webpackConfig({
      production: isProduction,
      watch: true
    })))
    .pipe(gulp.dest(BUILD_PATHS.js));
});

gulp.task('build', ['clean', 'build-css', 'build-js']);
gulp.task('default', ['build']);
