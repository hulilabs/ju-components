/* global module */
module.exports = function(grunt) {
    grunt.initConfig({
        jsRootDir : 'src',
        jscs : {
            src : grunt.option('files') || [
                '<%= jsRootDir %>/**/*.js',
                'Gruntfile.js'
            ],
            options : {
                config : '.jscsrc',
                fix : !!(grunt.option('fix'))
            }
        },

        mochaTest : {
            test : {
                src : [
                    'test/*.js'
                ]
            }
        },
        jshint : {
            options : {
                jshintrc : '.jshintrc'
            },
            self : ['Gruntfile.js'],
            all : {
                src : [
                    '<%= jsRootDir %>/**/*.js'
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jscs');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-newer');

    grunt.registerTask('test', [
            'jscs',
            'newer:jshint'
            // uncomment for running unit tests when available
            // 'mochaTest'
        ]
    );
};
