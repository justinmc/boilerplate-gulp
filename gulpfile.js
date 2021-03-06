var _ = require('lodash');
var babelify = require('babelify');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var concat = require('gulp-concat');
var connect = require('gulp-connect');
var del = require('del');
var eslint = require('gulp-eslint');
var gulp = require('gulp');
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var watchify = require('watchify');

var bases = {
  app: 'app/',
  dist: 'dist/',
};

var paths = {
  scripts: ['js/**/*.js', '!js/vendor/**/*.js', '!js/plugins.js'],
  scriptsVendor: ['js/vendor/**/*.js'],
  styles: ['css/**/*.css'],
  html: ['index.html', '404.html'],
  extras: ['crossdomain.xml', 'humans.txt', 'manifest.appcache', 'robots.txt', 'favicon.ico'],
};

// Delete the dist directory
gulp.task('clean', function() {
  return del.sync([
    bases.dist + '**'
  ]);
});

// Process scripts and concatenate them into one output file
gulp.task('scripts', ['clean'], function() {
  var b = watchify(browserify(_.assign({}, watchify.args, {
    entries: './app/js/main.js', 
    debug: true,
    transform: [babelify],
    noparse: ['underscore']
  })));

  b.on('update', bundle);
  b.on('log', gutil.log);

  function bundle() {
    gulp.src(paths.scripts, {cwd: bases.app})
      .pipe(eslint())
      .pipe(eslint.format());

    return b.bundle()
      .on('error', function(err) {
        var args = Array.prototype.slice.call(arguments);
        gutil.log.apply(null, args.map(function(arg) {
          return arg.message;
        }));
        this.emit('end');
      })
      .pipe(source('app.min.js'))
      .pipe(gulp.dest(bases.dist + 'js/'))
      .pipe(connect.reload());
  }

  return bundle();
});

// Copy all other files to dist directly
gulp.task('copy', ['clean'], function() {
  // Copy html
  gulp.src(paths.html, {cwd: bases.app})
    .pipe(gulp.dest(bases.dist));

  // Copy styles
  gulp.src(paths.styles, {cwd: bases.app})
    .pipe(gulp.dest(bases.dist + 'css'));

  // Copy vendor js
  gulp.src(paths.scriptsVendor, {cwd: bases.app})
    .pipe(gulp.dest(bases.dist + 'js/vendor'));

  // Copy extra html5bp files
  gulp.src(paths.extras, {cwd: bases.app})
    .pipe(gulp.dest(bases.dist));
});

// Define the default task as a sequence of the above tasks
gulp.task('default', ['clean', 'scripts', 'copy']);

// A development task to run anytime a file changes
gulp.task('watch', function() {
  gulp.watch('app/**/*', ['clean', 'scripts', 'copy']);
});

gulp.task('serve', ['default', 'watch'], function() {
  return connect.server({
    root: 'dist',
    livereload: true
  });
});
