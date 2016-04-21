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
            'ju-shared/observable-class',
            'ju-components/data-flow/save/strategy',
            'ju-components/data-flow/save/strategies/changed',
            'ju-components/data-flow/save/strategies/immediate',
            'ju-components/helper/options'
        ],
        function(
            ObservableClass,
            SaveStrategy,
            SaveChangedStrategy,
            SaveImmediateStrategy,
            OptionsHelper
        ) {

    'use strict';

    /**
     * Adds a save handler to a base component lifecycle
     *
     * @param  {object} opts
     * {
     *   ...
     *   strategy
     * }
     */
    var SaveHandler = ObservableClass.extend({
        init : function(opts) {
            this.opts = OptionsHelper.buildOptsObject({
                strategy : SaveHandler.STRATEGY.ALL,
                tracker : null,
                component : null,
                prepareDataToSave : null,
                trackEvents : []
            }, opts);
        },

        setup : function(component) {
            // define payload handler base on strategy
            this.saveStrategy = this._determineSaveStrategy(
                    this.opts.tracker,
                    this.opts.strategy,
                    component
            );
            this.saveStrategy.setup({
                trackEvents : this.opts.trackEvents
            });
        },

        _determineSaveStrategy : function(tracker, strategy, component) {
            // Payload handler options
            var opts = {
                component : component
            };

            // Bypass tracker ONLY if a custom one is provided
            if (tracker) {
                opts.tracker = tracker;
            }

            var saveStrategy = null;
            // Payload handler
            switch (strategy) {
                case SaveHandler.STRATEGY.CHANGED:
                    saveStrategy = new SaveChangedStrategy(opts);
                    break;
                case SaveHandler.STRATEGY.IMMEDIATE:
                    saveStrategy = new SaveImmediateStrategy(opts);
                    break;
                default:
                // default save strategy will save all
                    saveStrategy = new SaveStrategy(opts);
            }

            return saveStrategy;
        },

        /**
         * Uses a custom set of data which follows the structure of a bount components tree
         * to initialize the strategy
         * Useful for telling the strategy that a component was initialized with some data
         * @param  {Object} dataModel
         */
        initializeStrategyWithDataModel : function(dataModel) {
            this.saveStrategy.initializeWithDataModel(dataModel);
        },

        /**
         * Triggers a save action in the current component
         * including the children component's data
         *
         * @return Promise Save promise
         */
        saveData : function(component) {
            var errors = this._validateAll(component),
                savePromise;

            if (!errors || errors.length === 0) {
                // obtains and process data to be saved
                var dataToSave = this._getDataToSave(component);
                savePromise = this._submitDataToServer(dataToSave);

                savePromise
                    .then($.proxy(this._onSaveSuccess, this))
                    ['catch']($.proxy(this._onSaveError, this));

            } else {
                savePromise = this._getInvalidFieldsPromise(errors);
            }

            return savePromise;
        },

        _getDataToSave : function(component) {
            // obtains data from strategy
            var data = this.saveStrategy.getDataForSubmission(component);
            // checks if there's a provided callback to make changes before the request
            var dataForProxy = this._prepareDataWithCallbackOpt(data);

            return dataForProxy;
        },

        /**
         * Called with the final data right before calling `_submitDataToServer`
         * @param  {Object} data current data to be sent to the server
         * @return {Object}      {data, metadata} objects for the proxy
         */
        _prepareDataWithCallbackOpt : function(data) {
            if ('function' === typeof this.opts.prepareDataToSave) {
                return this.opts.prepareDataToSave(data);
            }

            return {
                payload : data,
                metadata : null
            };
        },

        /**
         * Saves the data to the server using the proxy
         * Overwrite this method in the child classes
         * @abstract
         * @see ju-components/data-flow/save/strategy
         *
         * @param  object dataForProxy {'data' to be saved, 'metadata' for proxy only}
         * @return Promise  A save promise
         */
        _submitDataToServer : function(dataForProxy) {
            var self = this;
            return new Promise(function(resolve, reject) {
                self.opts.saveProxyCallback(dataForProxy.payload, resolve, reject, dataForProxy.metadata);
            });
        },

        /**
         * Handles the save success event triggered from the payloadHandler by
         * bypassing the event to the higher level.
         * @abstract
         * @see ju-components/data-flow/save/strategy
         */
        _onSaveSuccess : function(response) {
            this.trigger(SaveHandler.EV.SAVE_HANDLER_SUCCESS, response);

            this.saveStrategy.onSaveSuccess(response);
        },

        _onSaveError : function(e) {
            this.trigger(SaveHandler.EV.SAVE_HANDLER_ERROR, e);
        },

        /**
         * Returns a rejected promise so it's handled afterwars
         * @abstract
         */
        _getInvalidFieldsPromise : function(errors) {
            return Promise.reject(errors);
        },

        /**
         * Validates that the current components does not contain any errors.
         */
        _validateAll : function(component) {

            var childrenRecursiveOpts =
                {
                    callOnChildren : function(comp) {
                        // We only call the validate method on the children if the validate method
                        // does not exists in the current component.
                        // The validate method is recursive by nature, this is why we prevent
                        // duplicate recursive calls
                        return comp.validate === undefined;
                    },
                    flatten : true
                };

            var childrenErrors = component.callRecursively(childrenRecursiveOpts, 'validate'),
                errors = $.grep(childrenErrors,function(n) { return n; }); //ComponentUtils.flatten(childrenErrors);

            return errors;
        }
    });

    SaveHandler.classMembers({
        STRATEGY : {
            ALL : 'all',
            CHANGED : 'changed',
            NONE : 'none',
            IMMEDIATE : 'immediate'
        },

        EV : {
            SAVE_HANDLER_SUCCESS : 'h-saveSuccess',
            SAVE_HANDLER_ERROR : 'h-saveError'
        }
    });

    return SaveHandler;

});
