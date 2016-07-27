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
            'ju-components/data-flow/fetch/handler',
            'ju-components/data-flow/events'
        ],
        function(
            FetchHandler,
            DataBehaviorEvents
        ) {

    'use strict';

    /*
        Private functions
     */
    /**
     * Sets data into a component, if successful will trigger FETCH_DATA_READY
     * @param {Component} component
     * @param {Object}    data
     */
    var setDataWithSuccessTrigger = function(component, data) {
        var setDataResult = component.setData(data);
        if (setDataResult && setDataResult.success) {
            component.fireEventAndNotify(DataBehaviorEvents.EV.COMPONENT.FETCH_DATA_READY);
        }
    };

    /*
        opts : {
            component
            prepareDataForFetch
            proccessResponse
            fetchCallback
        }
     */
    var FetchDataBinder = function FetchDataBinder(opts) {
        this.opts = opts;

        this.fetchHandler = new FetchHandler({
            prepareDataForFetch : this.opts.prepareDataForFetch,
            proccessResponse : this.opts.proccessResponse,
            fetchCallback : this.opts.fetchCallback
        });
    };

    FetchDataBinder.prototype = {
        /*
            `arguments` is the data to be passed to the proxy's function to make an AJAX request

            i.e. if you call
                fetchData(a,b,c)
            expect proxy method to be called like this
                proxy.fetch(a, b, c, _privateSuccessHandler, _privateErrorHandler)

            just remember that `_privateSuccessHandler` and `_privateErrorHandler` are added internally
            in the `FetchHandler` so you don't have to worry about them (:
         */
        fetchData : function(dataForFetch) {
            var component = this.opts.component;
            component.toggleSpinnerVisibility(true);

            var afterFetchDataHandler = $.proxy(component.toggleSpinnerVisibility, component, false);

            // asks handler to retrieve data
            var dataPromise = this.fetchHandler.fetchData(dataForFetch);
            // regardless of success/error on data fetch, turns off the spinner ^^
            dataPromise.then(afterFetchDataHandler, afterFetchDataHandler);
            // this promise will be resolved with the fetched data
            return dataPromise;
        },

        /**
         * Sets data into bound component and triggers a DATA_READY event if it's successful
         * @param {Object} data
         */
        setData : function(data) {
            return setDataWithSuccessTrigger(this.opts.component, data);
        }
    };

    // static methods
    FetchDataBinder.setDataWithSuccessTrigger = setDataWithSuccessTrigger;

    // Exports
    return FetchDataBinder;
});
