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
            'ju-components/data-flow/save/changes-tracker',
            'ju-components/data-flow/save/changes/collect-changed-components'
        ],
        function(
            ChangesTracker,
            CollectChangedComponentsFn
        ) {
    'use strict';

    /**
     * This changes tracker will store changed component in a bag
     * so they can later be retrieved for payload construction
     */
    var ChangedTracker = ChangesTracker.extend({
        init : function() {
            this._super.apply(this, arguments);

            // Changed components collector
            CollectChangedComponentsFn.call(this);
        },
        modifiedHandler : function(changedComponent) {
            var added = this.addChangedComponent(changedComponent);
            if (added) {
                this.fireEvent(ChangesTracker.EV.COMPONENT_CHANGED, changedComponent);
            }
        }
    });

    ChangedTracker.classMembers({
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
                changesTracker = new ChangedTracker(backboneInst);
                backboneInst.addSharedInstance(sharedInstanceKey, changesTracker);
            }

            return changesTracker;
        }
    });

    // Exporting module
    return ChangedTracker;

});
