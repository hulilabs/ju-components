/**                   _
 *  _             _ _| |_
 * | |           | |_   _|
 * | |___  _   _ | | |_|
 * | '_  \| | | || | | |
 * | | | || |_| || | | |
 * |_| |_|\___,_||_| |_|
 *
 * (c) Huli Inc
 */

/**
 * Provides async CSS files loading
 */
define([
            'jquery',
            'ju-shared/observable-class',
            'ju-shared/md5-encoder',
            'ju-shared/app-config-manager'
        ],
        function(
            $,
            ObservableClass,
            Encoder,
            AppConfig
        ) {
    'use strict';

    // additional dependencies
    var Modernizr = window.Modernizr;

    var CssLoader = ObservableClass.extend({
        init : function() {
            // caches the name of already loaded files as keys
            this.loadedFiles = {};

            // configuration for timeout used when load event isn't supported in a browser
            this.getCssTimeout = null;
            // high timeout (1 second) since it's expected to be used only in stock android browser
            // which may be dependent on a slow mobile connection
            // however, it's only a default and can be overridden in this.get
            this.DEFAULT_GET_CSS_TIMEOUT = 1000;

            this.t = {
                $head : $('head')
            };

            this.EP = {
                // used to build a request to stylesheet builder endpoint
                STYLESHEET : '/stylesheet'
            };

            var applicationVersion = AppConfig.get(AppConfig.k.VERSION),
                versionMd5 = Encoder.toMD5(applicationVersion);

            // Stores the app version locally
            this.appVersion = versionMd5;

        },

        /**
         * Builds a URL to append a <link> element to page's <head> tag, causing a dynamic CSS fetch
         * @param  {array}    filePathArray   array of required css filenames
         * @param  {Function} callback        called when the 'load' event is triggered in the new <link> tag
         *                                    or no CSS was loaded
         * @param {Function}  timeoutCallback optional callback used for timeout fallback if load event isn't supported
         *                                    in <link> tags
         * @param {Int}       timeout         milliseconds offset for timeoutCallback invocation
         */
        get : function(filePathArray, callback, timeoutCallback, timeout) {

            if (!filePathArray || !filePathArray.length) {
                // Nothing to load...
                return;
            }

            // obtains filenames to get, in encoded format
            var encodedFileNames = this.getEncodedFileNames(filePathArray);

            // appends the element only if a string was built
            if (encodedFileNames.length > 0) {
                var $link = this.buildLinkElement(encodedFileNames, this.appVersion);

                if (this.isLoadEventSupported($link)) {
                    // listens for load, if supported
                    $link.on('load', $.proxy(this.linkLoadCallback, this, $link, callback));

                } else if (callback || timeoutCallback) {
                    // timeout fallback, in case listening on load doesn't work
                    var timeToWait = timeout || this.DEFAULT_GET_CSS_TIMEOUT,
                        timeoutHandler = timeoutCallback || callback;

                    this.getCssTimeout = setTimeout($.proxy(this.timeoutCallback, this, timeoutHandler), timeToWait);
                }

                this.t.$head.append($link);

            // loading a CSS wasn't necessary, use callback directly (if any)
            } else {
                log('NO CSS LOAD WAS REQUIRED');
                if (callback && typeof callback === 'function') {
                    callback();
                }
            }
        },
        /**
         * Given an array of css paths to load
         * it will use the CSSLoader to append each file individually in the head
         */
        getIndividualFiles : function(filePathArray) {
            var currentFile,
                stripPrefix = '',
                stripSufix = '-' + this.appVersion,
                $cssContainer = $('<div/>');

            for (var i = 0; i < filePathArray.length; ++i) {
                currentFile = filePathArray[i];
                // checks if the file was already loaded
                if (!this.loadedFiles[currentFile]) {
                    this.loadedFiles[currentFile] = true;

                    currentFile = this.sanitizeString(currentFile, stripPrefix, stripSufix);
                    currentFile = '/' + currentFile + '.css';

                    var $link = $('<link>');
                    $link.attr({
                        rel : 'stylesheet',
                        href : currentFile
                    });
                    $cssContainer.append($link);
                }
            }
            // Append all the stylesheets to the head at once
            this.t.$head.append($cssContainer.html());
        },
        /**
         * Handler for load event, triggered when
         * @param  {$}        $link         fired load event
         * @param  {Function} callback optional
         */
        linkLoadCallback : function($link, callback) {
            log('loaded CSS');

            $link.off('load');

            if (callback && typeof callback === 'function') {
                callback();
            }
        },

        /**
         * Handler for timeout used in fallback when this.isLoadEventSupported returns false
         * @param  {Function} callback optional
         */
        timeoutCallback : function(callback) {
            if (this.getCssTimeout) {
                clearTimeout(this.getCssTimeout);
                this.getCssTimeout = null;
            }

            if (callback && typeof callback === 'function') {
                callback();
            }
        },

        /**
         * Builds a jQuery object of a link tag that points to /stylesheet endpoint
         * @param  {string} encodedFileNames result of this.getEncodedFileNames
         * @param  {string} versionMd5       application version MD5
         * @return {$}
         */
        buildLinkElement : function(encodedFileNames, versionMd5) {
            var $link = $('<link>');
            $link.attr('rel', 'stylesheet');
            $link.attr('href', this.EP.STYLESHEET + '?v=' + versionMd5 + '&s=' + encodedFileNames);

            return $link;
        },

        /**
         * Tests if load event is supported for a given element
         * @param  {$}  $element
         * @return {Boolean} true if supported
         */
        isLoadEventSupported : function($element) {
            return Modernizr.hasEvent('load', $element);
        },
        /**
         * Returns whether the file has already been loaded
         * @return {Boolean} true if the file was already loaded
         */
        isFileLoaded : function(filePath) {
            return this.loadedFiles[filePath];
        },
        /**
         * For a filename array, builds a comma separated string with the filenames that
         * aren't already a key in this.loadedFiles
         * @param  {array} filePathArray array of strings
         * @return {String}              base64 encoded filenames or '' if all files are already loaded
         */
        getEncodedFileNames : function(filePathArray) {
            var filesToRequire = [],
                currentFile,
                stripPrefix = 'css/',
                stripSufix = '-' + this.appVersion;

            for (var i = 0; i < filePathArray.length; ++i) {
                currentFile = filePathArray[i];
                // checks if the file was already loaded
                if (!this.loadedFiles[currentFile]) {
                    this.loadedFiles[currentFile] = true;

                    currentFile = this.sanitizeString(currentFile, stripPrefix, stripSufix);

                    filesToRequire.push(currentFile);
                }
            }

            // empty string returned if all files are already loaded
            if (0 === filesToRequire.length) {
                return '';
            }

            var filePathString = filesToRequire.join(',');
            return filePathString;
        },

        /**
         * Strips the specified prefix and sufix from the sourceStr
         */
        sanitizeString : function(sourceStr, prefix, sufix) {
            if (!sourceStr) {
                return sourceStr;
            }
            var regexExp = '(^' + prefix + ')|(' + sufix + '$)',
                regex = new RegExp(regexExp, 'gi');

            return sourceStr.replace(regex, '');
        },

        /**
         * Appends the styles in a <style> tag element
         * to the $toElem
         *
         */
        appendInlineStyles : function(stylesText, $toElem) {

            // inject it at the bottom of the page so it overrides your CSS above it
            $toElem = $toElem || $('body');

            var css = document.createElement('style');
            css.type = 'text/css';

            if (css.styleSheet) {
                css.styleSheet.cssText = stylesText;
            } else {
                css.appendChild(document.createTextNode(stylesText));
            }

            $toElem.append(css);
        }
    });

    return CssLoader;

});
