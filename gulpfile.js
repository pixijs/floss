var gulp = require('gulp');
require('jibo-gulp')(gulp, {
    name: 'floss',
    releaseReadme: 'README.md',
    releaseSrc: [
        'lib/**',
        '.npmignore',
        'package.json',
        'bin/**',
        'electron/**'
    ]
});