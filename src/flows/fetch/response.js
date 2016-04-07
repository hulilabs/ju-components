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
 * Response Handler
 * @abstract
 */
define([
            'ju-components/handler'
        ],
        function(
            BaseHandler
        ) {

    'use strict';

    var ResponseHandler = BaseHandler.extend({
        /**
         * Process the data given by the result of a fetch data method
         * @param {object} response server response
         * @abstract
         */
        process : function(/* response */) {
            var component = this.component,
                response = arguments.length > 0 ? arguments[0] : null,
                args = Array.prototype.slice.call(arguments, 1),
                result = null; // setDataResult

            // If the response is explicitly null or undefined
            // then we return since there is nothing to process
            if (response === null || response === undefined) {
                log('ResponseHandler: No data to process...');
                return;
            }
            // At this point, the server returned data but we need
            // to check that has the right format
            if (response.data && response.data.response_data) {
                result = component.setData.apply(component, $.merge([response.data.response_data], args));
            } else {
                Logger.error('Component: response from server does not have the expected format');
            }

            return result;
        }
    });

    return ResponseHandler;

});
