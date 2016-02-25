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

define([
            'ju-components/handler',
            'ju-components/flows/fetch/payload',
            'ju-components/flows/fetch/response'
        ],
        function(
            BaseHandler,
            PayloadHandler,
            ResponseHandler
        ) {
    'use strict';

    /**
     * Adds a proxy to a base component lifecycle
     *
     * On base component setup:
     *   setupPayloadHandler, _super, fetchData
     *
     * @param  {object} opts
     * {
     *   component,
     *   proxy
     * }
     */
    var FetchHandler = BaseHandler.extend({
        init : function() {
            this.setOptions({
                proxy : null
            });

            this._super.apply(this, arguments);

            // Define fetchHandler in component
            this.component.fetchHandler = this;
        },
        setup : function() {
            // Payload handler
            this.setupPayloadHandler();

            // Response handler
            this.setupResponseHandler();
        },
        /**
         * Initialize payload handler and run setup
         */
        setupPayloadHandler : function() {
            this.payloadHandler = new PayloadHandler({ component : this.component });
        },
        /**
         * Initialize response handler and run setup
         */
        setupResponseHandler : function() {
            this.responseHandler = new ResponseHandler({ component : this.component });
        },
        /**
         * Decorator for fetchData
         * This is also the main action of a proxy-handler
         */
        process : function() {
            this.fetchData(arguments);
        },
        /**
         * Triggers the provided proxy main fetch
         * @param {array|arguments} args component setup params
         */
        fetchData : function(args) {
            // Pass the rest of the parameters to fetchDataWithParams
            // Transform arguments into an array
            var params = Array.prototype.slice.call(args, 1);

            // @TODO: calling this method in the setup method instead of the load,
            // will cause that the data cannot be fetched at the same time as the components resources
            this.fetchDataWithParams.apply(this, params);
        },
        /**
         * Fetching data process
         * @param {array|arguments} params component setup params
         */
        fetchDataWithParams : function(/* params... */) {
            var self = this,
                waitForPromise,
                params = this.processFetchPayload.apply(this, arguments);

            // Enable the spinner before we start fetching data
            this.component.toggleSpinnerVisibility(true);

            // @TODO: prevent fetching when no arguments were passed?
            // Store the promise locally
            this.fetchDataWithParamsPromise = this.fetchDataFromServer.apply(this, params);

            // Append to the end of the
            if (this.component.isRootComponent && this.component.setupCompletedPromise) {
                waitForPromise =
                    this.component.setupCompletedPromise
                    .then(function() {
                        // Wait until all the components tree is rendered (setup is completed) to load the data into them
                        return self.fetchDataWithParamsPromise;
                    });
            } else {
                // This component is part of the component tree but is not the root.
                // Hence we assume that the component tree is already rendered in the screen
                // (setup  methods call is completed)
                //
                // @TODO: Check What happens when a base with proxy is coded inside a base with proxy that already loads it's data
                waitForPromise = this.fetchDataWithParamsPromise;
            }

            waitForPromise
                .then($.proxy(this.processFetchResponse, this))
                // Catch any error in the chain
                ['catch']($.proxy(this.errorFetchingData, this))
                // Hide the spinner
                .then($.proxy(this.component.toggleSpinnerVisibility, this.component, false));
        },
        /**
         * Calls a proxy main fetch for retrieving current component data
         * Data should always be retrieved by a proxy (no direct ajax requests)
         *
         * @param {array} params component setup params
         * @return Promise resolves when response data is received
         * @abstract
         */
        fetchDataFromServer : function(/* params... */) {
            var self = this,
                params = arguments;

            var dataPromise = new Promise(function(resolve, reject) {
                // Children of base component proxy
                // By default, it should provide a 'fetch' method
                // or this whole method can be overwritten to customize the method
                // ju-components/proxy
                if (self.opts.proxy != null && self.opts.proxy.fetch) {
                    self.opts.proxy.fetch(params, resolve, reject);
                } else {
                    Logger.error('FetchHandler: no proxy setup or "fetch" method is not defined');
                }
            });
            return dataPromise;
        },
        /**
         * Process fetch payload data before request
         * @param {arguments} payload unprocessed payload data
         *                    component setup arguments
         * @return {array|arguments} processed request payload
         */
        processFetchPayload : function(/* payload */) {
            var payloadHandler = this.payloadHandler;
            return payloadHandler.process.apply(payloadHandler, arguments);
        },
        /**
         * Process fetch response after request
         * @param {object} response
         * @return {object} processed response
         */
        processFetchResponse : function(/* response */) {
            var responseHandler = this.responseHandler,
                result = responseHandler.process.apply(responseHandler, arguments);

            // Notify data set succesfully from root component
            if (result && result.success) {
                this.component.fireEventAndNotify(FetchHandler.EV.DATA_READY, result);
            }

            return result;
        },
        /**
         * There is an error trying to fecth data for this component
         */
        errorFetchingData : function() {
            Logger.error('FetchHandler: error fetching data', arguments);
        },
        /**
         * Proxy getter
         * @return {BaseProxy}
         */
        getProxy : function() {
            return this.opts.proxy;
        },
        /**
         * Payload handler getter
         * @return {PayloadHandler} payload handler object
         */
        getPayloadHandler : function() {
            return this.payloadHandler;
        },
        /**
         * Response handler getter
         * @return {ResponseHandler} response handler object
         */
        getResponseHandler : function() {
            return this.responseHandler;
        }
    });

    FetchHandler.classMembers({
        EV : {
            DATA_READY : 'dataReady'
        }
    });

    // Exporting module
    return FetchHandler;

});
