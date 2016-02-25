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
            'ju-components/flows/fetch/handler',
            'ju-components/flows/save/strategies/all',
            'ju-components/flows/save/strategies/changed',
            'ju-components/flows/save/strategies/immediate'
        ],
        function(
            FetchHandler,
            SaveAllStrategy,
            SaveChangedStrategy,
            SaveImmediateStrategy
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
    var SaveHandler = FetchHandler.extend({
        init : function() {
            this.setOptions({
                strategy : SaveHandler.STRATEGY.ALL,
                tracker : null
            });

            // Initialize proxy
            this._super.apply(this, arguments);

            // Define saveHandler in component
            this.component.saveHandler = this;
        },

        /**
         * Define payload handler base on strategy
         * then initialize and run setup
         */
        setupPayloadHandler : function() {
            this.setupSaveStrategy();

            // This line is just to avoid confusion and readability
            this.payloadHandler = this.saveStrategy;
        },

        setupSaveStrategy : function() {
            // Payload handler options
            var opts = {
                component : this.component
            };

            // Bypass tracker ONLY if a custom one is provided
            if (this.opts.tracker) {
                opts.tracker = this.opts.tracker;
            }

            // Payload handler
            switch (this.opts.strategy) {
                case SaveHandler.STRATEGY.CHANGED:
                    this.saveStrategy = new SaveChangedStrategy(opts);
                    break;
                case SaveHandler.STRATEGY.IMMEDIATE:
                    this.saveStrategy = new SaveImmediateStrategy(opts);
                    break;
                case SaveHandler.STRATEGY.ALL:
                case SaveHandler.STRATEGY.NONE:
                    this.saveStrategy = new SaveAllStrategy(opts);
            }
        },

        /**
         * Strategy getter
         * @return {string} save strategy name
         * @match SaveHandler.STRATEGY
         */
        getStrategy : function() {
            return this.opts.strategy;
        },

        /**
         * Save strategy getter
         * @return {object} save strategy instance
         */
        getSaveStrategy : function() {
            return this.saveStrategy;
        },

        /**
         * Changes tracker getter
         * @return {object} changes tracker instance
         */
        getChangesTracker : function() {
            return this.getSaveStrategy().getTracker();
        },

        /**
         * Triggers a save action in the current component
         * including the children component's data
         *
         * @return Promise Save promise
         */
        saveData : function() {
            var errors = this.validateAll(),
                savePromise;

            if (!errors || errors.length === 0) {
                var saveStrategy = this.getSaveStrategy();
                savePromise = saveStrategy.saveData.apply(saveStrategy, arguments);
            } else {
                savePromise = this.getInvalidFieldsPromise(errors);
            }

            return savePromise;
        },

        /**
         * Saves the data to the server using the proxy
         * Overwrite this method in the child classes
         * @abstract
         * @see ju-components/flows/save/strategy
         *
         * @param  object dataToSave data to be saved
         * @return Promise  A save promise
         */
        submitDataToServer : function() {},

        /**
         * Handles the save success event triggered from the payloadHandler by
         * bypassing the event to the higher level.
         * @abstract
         * @see ju-components/flows/save/strategy
         */
        onSaveSuccess : function() {},

        /**
         * Returns a rejected promise so it's handled afterwars
         * @abstract
         */
        getInvalidFieldsPromise : function(errors) {
            return Promise.reject(errors);
        },

        /**
         * Validates that the current components does not contain any errors.
         */
        validateAll : function() {

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

            var childrenErrors = this.component.callRecursively(childrenRecursiveOpts, 'validate'),
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
        }
    });

    return SaveHandler;

});
