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

define( [
            'require',
            'jquery',
            'ju-shared/observable-class',
            'ju-components/blocks/editable',
            'ju-components/blocks/list',
            'ju-components/blocks/upload',
            'ju-components/helper/changes-bag'
        ],
        function (
            require,
            $,
            ObservableClass,
            Editable,
            ListComponent,
            UploadAreaComponent,
            ChangesBag
        ) {
    'use strict';

    /**
     * The ChangesTracker will be used to
     */
    var ChangesTracker = ObservableClass.extend({
        init : function (backboneInst) {
            this.changedComponents = [];
            this.backbone = backboneInst;
            this.isTracking = false;
        },
        track : function () {
            if (this.isTracking) {
                return;
            }
            var modifiedFn = $.proxy(this.modifiedHandler, this);

            // Editable fields
            this.backbone.on(Editable.EV.CHANGED, modifiedFn);
            this.backbone.on(Editable.EV.EDIT_MODE_ACTIVATED, $.proxy(this.editModeHandler, this));

            // Lists
            this.backbone.on(ListComponent.EV.CHILD_ADDED, modifiedFn);
            this.backbone.on(ListComponent.EV.CHILD_REMOVED, modifiedFn);
            this.backbone.on(ListComponent.EV.CLEARED, modifiedFn);

            // Upload areas
            this.backbone.on(UploadAreaComponent.EV.FILE_ADDED, modifiedFn);

            this.isTracking = true;
        },

        /**
         * Called when the user activates the edit mode of a component
         */
        editModeHandler : function(){
            log('ChangesTracker: component edit mode activated');
        },

        /**
         * Called when a component was modified
         * @return {[type]} [description]
         */
        modifiedHandler : function (changedComponent) {
            if (this.changedComponents.indexOf(changedComponent) === -1) {
                // Only add this event
                log('ChangesTracker: component change registered');
                this.changedComponents.push(changedComponent);

                this.fireEvent(ChangesTracker.EV.COMPONENT_CHANGED, changedComponent);
            }
        },
        /**
         * Returns a instance of changes bag with the modified components
         * that are children of the specified root component
         * @param  {[type]} rootComponent [description]
         * @return ChangesBag               [description]
         */
        getChangesBag : function (rootComponent) {
            var changesBag = ChangesBag.createInst(this, rootComponent, this.changedComponents);
            return changesBag;
        },
        /**
         * Removes the specified components
         * @param  {[type]} components [description]
         * @return {[type]}            [description]
         */
        removeFromChangedComponents : function (components) {
            var self = this;
            $.each(components, function (index, component) {
                var componentIndex = self.changedComponents.indexOf(component);
                if (componentIndex > -1) {
                    self.changedComponents.splice(componentIndex, 1);
                }
            });
        }
    });

    ChangesTracker.classMembers({
        EV : {
            COMPONENT_CHANGED : 'compChanged',
            COMPONENT_ACTIVATED : 'compActivated',
            COMPONENT_DEACTIVATED : 'compDeactivated',
            SAVE_READY : 'saveReady',
            SAVE_NOT_READY : 'saveNotReady'
        },
        getInst : function (backboneInst) {

            // check if the notification center has already an id
            if (!backboneInst) {
                Logger.error('ChangesTracker: A valid notification center must be provided');
                return;
            }

            var sharedInstanceKey = backboneInst._class.SHARED.CHANGES_TRACKER,
                changesTracker = backboneInst.getSharedInstance(sharedInstanceKey);

            if (!changesTracker) {
                // No instance was defined, create one
                changesTracker = new ChangesTracker(backboneInst);
                backboneInst.addSharedInstance(sharedInstanceKey, changesTracker);
            }

            return changesTracker;
        }
    });

    // Exporting module
    return ChangesTracker;

});
