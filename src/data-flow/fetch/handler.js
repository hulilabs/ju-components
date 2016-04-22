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
            'ju-shared/observable-class',
            'ju-components/helper/options'
        ],
        function(
            ObservableClass,
            OptionsHelper
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
     *     prepareDataForFetch : $.proxy(this._prepareDataForFetch, this),
     *     proccessResponse : $.proxy(this._proccessResponse, this),
     *     fetchCallback : null
     * }
     */
    var FetchHandler = ObservableClass.extend({
        init : function(opts) {
            this.opts = OptionsHelper.buildOptsObject({
                prepareDataForFetch : $.proxy(this._prepareDataForFetch, this),
                proccessResponse : $.proxy(this._proccessResponse, this),
                fetchCallback : null
            }, opts);
        },

        fetchData : function(dataForFetch) {
            var params = this.opts.prepareDataForFetch(dataForFetch);

            var self = this;
            var dataPromise = new Promise(function(resolve, reject) {
                self._fetchDataFromServer(params)
                .then($.proxy(self._processFetchResponse, self))
                .then(resolve)
                // Catch any error in the chain
                ['catch']($.proxy(self._errorFetchingData, self, reject));
            });

            return dataPromise;
        },

        /**
         * Calls a proxy main fetch for retrieving current component data
         * Data should always be retrieved by a proxy (no direct ajax requests)
         *
         * @param {array} params component setup params
         * @return Promise resolves when response data is received
         * @abstract
         */
        _fetchDataFromServer : function(dataForFetch) {

            var fetchCallback = this.opts.fetchCallback;
            if (fetchCallback) {
                return new Promise(function(resolve, reject) {
                    fetchCallback(dataForFetch.data, resolve, reject, dataForFetch.metadata);
                });
            } else {
                Logger.error('FetchHandler: no proxy setup or "fetch" method is not defined');
                return Promise.reject();
            }
        },

        _prepareDataForFetch : function(payload) {
            return {
                data : payload,
                metadata : null
            };
        },

        /**
         * Process fetch response after request
         * @param {object} response
         * @return {object} processed response
         */
        _processFetchResponse : function(response) {
            var result = this.opts.proccessResponse(response);

            return Promise.resolve(result);
        },

        _proccessResponse : function(response) {
            // If the response is explicitly null or undefined
            // then we return since there is nothing to process
            if (response === null || response === undefined) {
                log('ResponseHandler: No data to process...');
                return null;
            }
            // At this point, the server returned data but we need
            // to check that has the right format
            if (response.data && response.data.response_data) {
                return response.data.response_data;
            } else {
                Logger.error('Component: response from server does not have the expected format');
                return null;
            }
        },

        /**
         * There is an error trying to fecth data for this component
         */
        _errorFetchingData : function(callback, error) {
            Logger.error('FetchHandler: error fetching data', arguments);
            callback(error);
        }
    });

    return FetchHandler;
});
