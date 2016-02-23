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
 * Save strategy : Immediate
 */
define([
            'jquery',
            'ju-components/base-with-proxy/payload-handler',
            'ju-components/helper/changes-tracker'
        ],
        function(
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
    var SaveImmediateStrategy = PayloadHandler.extend({
        setup : function() {
            if (this.opts.tracker) {
                this.immediateTracker = this.opts.tracker.getInst(this.backbone);
            } else {
                Logger.error('Dashboard: a ImmediateTracker is needed to configure this component strategy');
            }

            // Subscribe to events
            this.immediateTracker.track();

            // listeing changed event
            this.immediateTracker.on(ChangesTracker.EV.COMPONENT_CHANGED, $.proxy(this.saveData, this));
        },

        saveData : function(triggeredEvent, dataToSave) {
            var self = this,
                savePromise = this.submitDataToServer(triggeredEvent, dataToSave);

            savePromise.then(function(response) {
                self.onSaveSuccess(triggeredEvent, response);
            });

            return savePromise;
        },
    });

    // Exporting module
    return SaveImmediateStrategy;
});
