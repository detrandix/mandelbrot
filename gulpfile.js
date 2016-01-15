var gulp = require('gulp')

var browserify = require('browserify');
var babelify = require('babelify');

var sass = require('gulp-sass');

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
		.pipe(gulp.dest('dist/js'))
}

gulp.task('scripts', function () {
	var bundler = browserify('src/js/app.js', { debug: true })
		.transform(babelify, {
			'presets': ['es2015']
		});

	return bundleJs(bundler);
});

gulp.task('styles', function() {
	gulp.src('src/scss/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('dist/css'));
});

gulp.task('default', ['scripts', 'styles']);
