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
 * Base component with proxy
 */
define([
            'jquery',
            'ju-components/base',
            'ju-components/base-with-proxy/payload-handler'
        ],
        function(
            $,
            BaseComponent,
            PayloadHandler
        ) {

    'use strict';

    var BaseWithProxy = BaseComponent.extend({
        init : function() {

            this.setOptions({
                proxy : null // must be instance, not class
            });

            this._super.apply(this, arguments);

            this.payloadHandler = PayloadHandler.getInst();
        },
        /**
         * Setups the component and triggers the provided proxy load
         */
        setup : function() {
            // var $insertionPoint = arguments.length > 0 ? arguments[0] : null;

            this._super.apply(this, arguments);

            // Pass the rest of the parameters to fetchDataWithParams
            // Transform arguments into an array
            var params = Array.prototype.slice.call(arguments, 1);

            // @TODO: calling this method in the setup method instead of the load,
            // will cause that the data cannot be fetched at the same time as the components resources
            this.fetchDataWithParams.apply(this, params);
        },
        /**
         * Retrieves the data from the server
         */
        fetchDataWithParams : function() {
            var self = this,
                waitForPromise;

            // Enable the spinner before we start fetching data
            self.toggleSpinnerVisibility(true);

            // @TODO: prevent fetching when no arguments were passed?
            // Store the promise locally
            self.fetchDataWithParamsPromise = this.getComponentPayload.apply(this, arguments);

            // Append to the end of the
            if (this.isRootComponent && self.setupCompletedPromise) {
                waitForPromise =
                    self.setupCompletedPromise
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
                waitForPromise = self.fetchDataWithParamsPromise;
            }

            waitForPromise
                .then($.proxy(self.processPayloadData, self))
                // Catch any error in the chain
                ['catch']($.proxy(self.errorFetchingData, self))
                // Hide the spinner
                .then($.proxy(self.toggleSpinnerVisibility, self, false));
        },
        /**
         * Function meant to be overwritten, receives parameters for the current component
         * and returns a Promise that will resolve to the data to be set into the component
         * @return Promise [description]
         */
        getComponentPayload : function() {
            var self = this,
                data = arguments;

            var dataPromise = new Promise(function(resolve, reject) {
                // Children of base component proxy
                // ju-components/base-with-proxy/proxy
                if (self.opts.proxy != null && self.opts.proxy.getPayload) {
                    self.opts.proxy.getPayload(data, resolve, reject);
                } else {
                    Logger.error('BaseWithProxy: no proxy setup or getPayload method is not defined');
                }
            });
            return dataPromise;
        },
        /**
         * Process the data given by the getComponent Payload method
         */
        processPayloadData : function(/* response */) {
            return this.payloadHandler.processPayloadData.apply(this, arguments);
        },
        /**
         * There is an error trying to fecth data for this component
         */
        errorFetchingData : function() {
            Logger.error('BaseWithProxy: error fetching data', arguments);
        }
    });

    BaseWithProxy.classMembers({

    });

    // Exporting module
    return BaseWithProxy;

});
