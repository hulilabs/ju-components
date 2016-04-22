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
 * Add options support on any class
 * - getOption : fn(key)
 * - getOptions : fn()
 * - prepareOptions : fn()
 * - setOptions : fn(opts)
 *
 * @warning must be used with decorators on class definition
 */
define([
            'jquery',
            'ju-shared/class'
        ],
        function(
            $,
            Class
        ) {
    'use strict';

    var OptionsHelper = Class.extend({
        init : function() {
            // Define options
            this._opts = {};

            // Define options collector
            this._initOptsCollector(true);
        },
        /**
         * Include options in the opts collector
         * Set default options and override parents options
         * Keeps the flow from child to parent (no untraceable flows with before and after super)
         * - Child options always have precedence over parent options
         * - Parent options should never overwrite children options
         * @warn ALWAYS call setOptions BEFORE _super
         * @param {object} class level options to queue
         */
        setOptions : function() {
            this._optsCollector = this._initOptsCollector();
            // Optimized array prepend
            var i, argLen, len = this._optsCollector.length + arguments.length,
                optsArr = new Array(len);

            for (i = 0, argLen = arguments.length; i < argLen; i++) {
                optsArr[i] = arguments[i];
            }

            for (i = 0; i < len; i++) {
                optsArr.push(this._optsCollector[i]);
            }
            this._optsCollector = optsArr;
        },
        /**
         * Options getter
         */
        getOptions : function() {
            return this._opts;
        },
        /**
         * Single option getter
         */
        getOption : function(key) {
            return this._opts[key];
        },
        /**
         * Transform collected options into this.opts
         * @param  {object} forcedOpts forced options over all collected options
         *                             normally provided by component definition
         */
        prepareOptions : function(forcedOpts) {
            // Merge options collector
            this._opts = $.extend.apply($, [true, {}].concat(this._optsCollector).concat([forcedOpts]));
            this._initOptsCollector(true);

            return this;
        },
        _initOptsCollector : function(clean) {
            this._optsCollector = (clean || !this._optsCollector) ? [] : this._optsCollector;
            return this._optsCollector;
        }

    });

    OptionsHelper.classMembers({
        buildOptsObject : function() {
            var mergeObjects = Array.prototype.concat.apply([{}], arguments);
            return $.extend.apply($, mergeObjects);
        }
    });

    // Export helper
    return OptionsHelper;
});
