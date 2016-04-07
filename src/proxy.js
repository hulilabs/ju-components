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
 * Base Component Proxy
 * @abstract
 */
define([
            'jquery',
            'ju-shared/base-proxy'
        ],
        function(
                    $,
                    BaseProxy
                ) {

    'use strict';

    var BaseComponentProxy = BaseProxy.extend({
        init : function(opts) {
            this._super.call(this, opts);
            this.EP = {
                API_PREFIX : BaseProxy.EP.API_PREFIX
            };
        },
        /**
         * Query initial component data
         *
         * IMPORTANT: 'fetch' is a naming convention for initial request for component data
         *            not the same as 'get' prefix which refers to at-any-moment request
         *
         * @return Promise
         * @abstract
         */
        fetch : function(data, resolve, reject) {} // jshint ignore:line
    });

    // Exports
    return BaseComponentProxy;

});
