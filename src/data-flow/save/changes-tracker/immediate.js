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
            'ju-components/data-flow/save/changes-tracker'
        ],
        function(
            ChangesTracker
        ) {
    'use strict';

    /**
     * This changes tracker will autosave any change
     */
    var ImmediateTracker = ChangesTracker.extend({
        modifiedHandler : function(changedComponent) {
            this.fireEvent(ChangesTracker.EV.COMPONENT_CHANGED, changedComponent);
        }
    });

    ImmediateTracker.classMembers({
        getInst : function(backboneInst) {
            // check if the notification center has already an id
            if (!backboneInst) {
                Logger.error('ChangesTracker: A valid backbone must be provided');
                return;
            }

            // ALL changes tracker will be stored as CHANGES_TRACKER at current backbone instance
            var sharedInstanceKey = backboneInst._class.SHARED.CHANGES_TRACKER,
                changesTracker = backboneInst.getSharedInstance(sharedInstanceKey);

            if (!changesTracker) {
                // No instance was defined, create one
                changesTracker = new ImmediateTracker(backboneInst);
                backboneInst.addSharedInstance(sharedInstanceKey, changesTracker);
            }

            return changesTracker;
        }
    });

    // Exporting module
    return ImmediateTracker;
});
