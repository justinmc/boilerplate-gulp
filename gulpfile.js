var gulp = require('gulp');
var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var browserify = require('browserify');
var connect = require('gulp-connect');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var bases = {
  app: 'app/',
  dist: 'dist/',
};

var paths = {
  scripts: ['js/**/*.js', '!js/vendor/**/*.js'],
  scriptsVendor: ['js/vendor/**/*.js'],
  styles: ['css/**/*.css'],
  html: ['index.html', '404.html'],
  extras: ['crossdomain.xml', 'humans.txt', 'manifest.appcache', 'robots.txt', 'favicon.ico'],
};

// Delete the dist directory
gulp.task('clean', function() {
  return gulp.src(bases.dist + '*')
    .pipe(clean());
});

// Process scripts and concatenate them into one output file
gulp.task('scripts', ['clean'], function() {
  gulp.src(paths.scripts, {cwd: bases.app})
    .pipe(jshint())
    .pipe(jshint.reporter('default'));

  var b = browserify({
    entries: './app/js/main.js', 
    debug: '!gulp.env.production'
  });

  b.bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(concat('app.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(bases.dist + 'js/'))
    .pipe(connect.reload());
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
