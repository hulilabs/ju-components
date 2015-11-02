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
                ){

    'use strict';

    var BaseComponentProxy = BaseProxy.extend({
        init : function () {
        	this.EP = {
            	API_PREFIX : BaseProxy.EP.API_PREFIX
            };
        },
        /**
         * Query component data
         * Only called first time the base-with-proxy is created
         *
         * @return Promise
         * @abstract
         */
        getPayload : function (data, resolve, reject) {} // jshint ignore:line
    });

    // Exports
    // context.PatientProxy = PatientProxy;
    return BaseComponentProxy;

});