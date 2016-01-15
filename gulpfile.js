var gulp = require('gulp')

var browserify = require('browserify');
var babelify = require('babelify');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');


function bundleJs(bundler) {
	return bundler.bundle()
		.pipe(source('app.js'))
		.pipe(buffer())
		.pipe(gulp.dest('dist'))
		.pipe(rename('app.min.js'))
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(uglify())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist'))
}

gulp.task('default', function () {
	var bundler = browserify('src/app.js', { debug: true })
		.transform(babelify, {
			'presets': ['es2015']
		});

	return bundleJs(bundler);
});
