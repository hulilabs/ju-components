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
 * Save strategy : Changed
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
    var SaveChangedStrategy = PayloadHandler.extend({
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
        saveData : function (onSuccess) {
            // Allow force all data in this model
            var data,
                savePromise,
                changedChildren = null,
                self = this;


            var errors = this.validateAll();

            if (!errors || errors.length === 0) {

                // Select strategy to collect then unsaved data
                var changesTracker = ChangesTracker.getInst(this.backbone),
                    changesBag = changesTracker.getChangesBag(this),
                    changedChildren = changesBag.getChangedChildrenInstances();

                data = this.getData(changedChildren);

                savePromise = this.submitDataToServer(data, onSuccess);

                savePromise.then(function (response) {
                    // Commits the set of changes
                    changesBag.commit();

                    self.onSaveSuccess(response);
                });

            } else {
                savePromise = this.getInvalidFieldsPromise(errors);
            }

            return savePromise;
        },
        /**
         * Mark components with data as changed in the changes tracker
         *
         */
        markComponentsWithData : function (data) {
            var changesTracker = ChangesTracker.getInst(this.backbone);

            if (!data || !changesTracker || !this.getComponents()) {
                return;
            }

            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var childComp = this.c(key);
                    if (childComp) {
                        changesTracker.modifiedHandler(childComp);
                    }
                }
            }
        }
    });

    // Exporting module
    return SaveChangedStrategy;

});
