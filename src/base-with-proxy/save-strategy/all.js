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
 * Save strategy : All
 */
define( [
            'jquery',
            'ju-components/base-with-proxy/payload-handler',
            'ju-components/helper/changes-tracker'
        ],
        function (
            $,
            PayloadHandler,
            ChangesTracker
        ) {
    'use strict';

    /**************************************************
     *
     * IMPORTANT : All the methods here called in the scope of the base with save instance
     *
     **************************************************/
    var SaveAllStrategy = PayloadHandler.extend({
    	setup : function () {
            /*
                At this point we know that the notification center has already been set
             */
            var changesTracker = ChangesTracker.getInst(this.backbone);
            // Subscribe to events
            changesTracker.track();
        },
        /**
         * Triggers a save action in the current component
         * including the children component's data
         *
         * @return Promise Save promise
         */
        saveData : function () {
            // Allow force all data in this model
            var data,
                savePromise,
                self = this;

            var errors = this.validateAll();
            if (!errors || errors.length === 0) {
                // If there is'nt any errors in the components tree
                // then submit
                data = this.getData();

                savePromise = this.submitDataToServer(data);

                savePromise.then(function (response) {
                    self.onSaveSuccess(response);
                });
            } else {
                savePromise = this.getInvalidFieldsPromise(errors);
            }

            return savePromise;
        }
    });

    // Exporting module
    return SaveAllStrategy;

});
