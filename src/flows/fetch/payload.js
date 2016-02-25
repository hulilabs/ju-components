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
 * Request handler
 * @abstract
 */
define([
            'ju-components/handler'
        ],
        function(
            BaseHandler
        ) {

    'use strict';

    var PayloadHandler = BaseHandler.extend({
        /**
         * Process payload data for request
         * @param {object}  payload data
         * @return {array|arguments} processed payload data
         * @abstract
         */
        process : function(/* payload */) {
            return arguments;
        }
    });

    return PayloadHandler;

});
