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
define( [
            'jquery',
            'ju-components/base-with-proxy',
            'ju-components/base-with-proxy/save-strategy/all',
            'ju-components/base-with-proxy/save-strategy/changed'
        ],
        function (
            $,
            BaseComponentWithProxy,
            SaveAllStrategy,
            SaveChangedStrategy
        ) {

    'use strict';

    var BaseWithSave = BaseComponentWithProxy.extend({
        init : function () {

            this.setOptions({
                saveStrategy : BaseWithSave.STRATEGY.ALL,
            });

            this._super.apply(this, arguments);

            switch (this.opts.saveStrategy) {
                case BaseWithSave.STRATEGY.CHANGED:
                    this.payloadHandler =  new SaveChangedStrategy();
                    break;
                case BaseWithSave.STRATEGY.ALL:
                case BaseWithSave.STRATEGY.NONE:
                    this.payloadHandler =  new SaveAllStrategy();
            }
        },
        /**
         * Extra setup for the base with save component
         */
        setup : function () {
            if (this.payloadHandler.setup) {
                this.payloadHandler.setup.apply(this, arguments);
            }
            this._super.apply(this, arguments);
        },
        /**
         * Triggers a save action in the current component
         * including the children component's data
         *
         * @return Promise Save promise
         */
        saveData : function () {
            var promise = this.payloadHandler.saveData.apply(this, arguments);
            return promise;
        },
        /**
         * Saves the data to the server using the proxy
         * Overwrite this method in the child classes
         *
         * @param  object dataToSave data to be saved
         * @return Promise  A save promise
         */
        submitDataToServer : function (dataToSave) { // jshint ignore:line
        },
        /**
         * Handles the save success event triggered from the payloadHandler by
         * bypassing the event to the higher level.
         */
        onSaveSuccess: function(response) {
            this.trigger(BaseWithSave.EV.SAVE_SUCCESS, response);
        },
        /**
         * Returns a rejected promise so it's handled afterwars
         */
        getInvalidFieldsPromise : function (errors) {
            return Promise.reject(errors);
        },
        /**
         * Validates that the current components does not contain any errors.
         * This happens everytime, whether the save strategy is CHANGED or ALL.
         */
        validateAll : function() {

            var childrenRecursiveOpts =
                {
                    callOnChildren : function (comp) {
                        // We only call the validate method on the children if the validate method
                        // does not exists in the current component.
                        // The validate method is recursive by nature, this is why we prevent
                        // duplicate recursive calls
                        return comp.validate === undefined;
                    },
                    flatten : true
                };

            var childrenErrors = this.callRecursively(childrenRecursiveOpts, 'validate'),
                errors = $.grep(childrenErrors,function(n){ return n; }); //ComponentUtils.flatten(childrenErrors);

            return errors;
        }
    });

    BaseWithSave.classMembers({
        EV: {
            SAVE_SUCCESS: 'saveSuccess',
            SAVE_ERROR : 'saveError',
            CANCELLED : 'onCancel'
        },
        STRATEGY : {
            ALL : 'all',
            CHANGED : 'changed',
            NONE : 'none'
        }
    });

    return BaseWithSave;

});
