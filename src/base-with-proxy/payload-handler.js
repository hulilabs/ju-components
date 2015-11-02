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
 * Payload Handler
 * @abstract
 */
define( [
            'jquery',
            'ju-shared/observable-class'
        ],
        function (
            $,
            ObservableClass
        ) {

    'use strict';

    var PayloadHandler = ObservableClass.extend({
        /**
         * Process the data given by the get component payload method
         * @abstract
         */
        processPayloadData : function () {
        	var response = arguments.length > 0 ? arguments[0] : null,
        		args = Array.prototype.slice.call(arguments, 1);

            // If the response is explicitly null or undefined
            // then we return since there is nothing to process
            if (response === null || response === undefined) {
                log('PayloadHandler: No data to process...');
                return;
            }
            // At this point, the server returned data but we need
            // to check that has the right format
            if (response.data && response.data.response_data) {
                var setSuccesfully = this.setData.apply(this, $.merge([response.data.response_data], args));

                // Notify data set succesfully from root component
                if (setSuccesfully) {
                    this.fireEventAndNotify(PayloadHandler.EV.DATA_READY);
                }
            } else {
                Logger.error('Component: response from server does not have the expected format');
            }
        }
    });

    PayloadHandler.classMembers({
        EV : {
            DATA_READY : 'dataReady'
        }
    });

    return PayloadHandler;

});
