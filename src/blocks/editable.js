
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
 * Base component
 */
define([
            'ju-components/blocks/base-ui',
            'ju-components/util',
            'ju-shared/util',
            'ju-components/helper/editable/mark-children-always-editable',
            /*
                Unmapped modules
             */
            'x-editable'
        ],
        function(
            BaseUIComponent,
            ComponentUtils,
            Util,
            MarkChildrenAlwaysEditableFn
        ) {
    'use strict';

    var SUPPORTED_EDIT_TRIGGERS = ['manual', 'mousedown', 'click', 'dbclick'],
        EDITABLE_CLASS_PREFIX = 'updateable',
        EDITABLE_ROOT = EDITABLE_CLASS_PREFIX + '-root',
        EDITABLE_EMPTY = EDITABLE_CLASS_PREFIX + '-empty',
        EDITABLE_LABEL = EDITABLE_CLASS_PREFIX + '-label',
        EDITING_CLASS_PREFIX = 'updating',
        ELEM_DATA_KEY = 'updateableComp',
        ALWAYS_EDITABLE_CLASS = 'always-editable';

    var RESOURCE_MAP = {
        cssFile : [
            'css/ju-components/blocks/editable'
        ]
    };

    /**
     * Represents a simple input text editable component
     */
    var EditableComponent = BaseUIComponent.extend({
        init : function() {

            this.setOptions({
                editModeTrigger : 'manual',
                editModeDevice : 'desktop',
                enableEditMode : false,
                eventCapturingPhase : false,
                alwaysEditable : false
            });

            this._super.apply(this, arguments);

            this.addResources(RESOURCE_MAP);

            // Bind close on document click
            EditableComponent.closeOnDocumentClick();
        },
        /**
         * Editable component basic events
         */
        bindEvents : function() {

            // false value in editModeTrrigger will disable the trigger by user events
            if (false !== this.opts.editModeTrigger) {
                this.setEditModeTrigger(this.opts.editModeTrigger);
            }

            // Removes the selected child
            this.$view.on('click', '.edit-row', $.proxy(this.editChild, this));

            // Save editable
            this.$view.on('click', '.save-row', $.proxy(this.saveClick, this));

            // Searches for all the children components that have the alwaysEditable property
            // and set them to true, this method will stop when he founds a node that
            // the property. It will be responsability of that node to propagate the property
            // to its children
            if (this.opts.alwaysEditable) {
                MarkChildrenAlwaysEditableFn.call(this);
            }
        },
        setupCompleted : function() {

            log('Saving Editable component....', this, this.$view);
            // Stores itself in the view data storage
            this.$view.data(ELEM_DATA_KEY, this);

            // Add base class to view
            this.$view.addClass(EDITABLE_CLASS_PREFIX);

            // Some editables are basic labels but their data is required by the server on save
            if (this.opts.readOnly || this.opts.enableEditMode) {
                this.$view.addClass(EDITABLE_LABEL);
            }

            // We specify NOT recursisve because we will only setup the current component
            // to view mode. The component life cycle will be in charge of setting themselves to
            // view mode
            if (this.opts.alwaysEditable && !this.opts.readOnly) {
                this.$view.addClass(ALWAYS_EDITABLE_CLASS);
                this.displayEditMode();
            } else {
                this.displayViewMode(true); // asume empty as default state
            }
        },
        /**
         * Process data set to editable
         */
        setData : function() {
            var self = this,
                result = this._super.apply(this, arguments),
                isEmpty = result.isEmpty,
                resultPromise = result.promise;

            if (resultPromise) {
                result.promise = resultPromise.then(function(isLocalEmpty) {
                    self.displayOnEmpty(isLocalEmpty);
                    return isLocalEmpty;
                });
            } else if (typeof isEmpty === 'boolean') {
                this.displayOnEmpty(result.isEmpty);
            } else {
                Logger.error('editable : cant resolve visibility', result);
            }

            return result;
        },
        /**
         * Open edit mode
         */
        editChild : function(e) {
            if (!this.opts.enableEditMode) {
                e.preventDefault();
                e.stopPropagation();
                this.enableEditMode(true);
            }
        },
        /**
         * Save edit mode
         */
        saveClick : function(e) {
            if (this.opts.enableEditMode) {
                e.preventDefault();
                e.stopPropagation();
                this.enableEditMode(false);
            }
        },
        /**
         * This is the main method to toggle between edit and view modes
         * Sets whether the current component is displayed as edit or view mode.
         * Calling this method will cause that all the children to switch to the
         * specified mode as well
         *
         * @param {Boolean} enableEdit true to set the component as editable
         */
        enableEditMode : function(enableEdit, force, eventInfo) {

            if (!force && this.opts.enableEditMode == enableEdit) {

                if (this.opts.enableEditMode) {
                    log('EditableComponent: already in edit mode');
                } else {
                    log('EditableComponent: already in view mode');
                }
                return;
            } else if (this.opts.readOnly) {
                log('EditableComponent: read-only mode');
                return;
            }

            // Assembles the object that will be passed to the displayEditMode method
            eventInfo = $.extend({
                editableRoot : this
            }, eventInfo);

            // Decides what method to call based on the current state
            if (enableEdit) {
                this.activateEditMode(eventInfo);
                this.fireEventAndNotify(EditableComponent.EV.EDIT_MODE_ACTIVATED);
            } else {
                var activateSuccesful = this.activateViewMode(eventInfo);

                if (activateSuccesful) {
                    this.fireEventAndNotify(EditableComponent.EV.DISPLAY_MODE_ACTIVATED);
                }
            }
        },
        /**
         * Sets the trigger for the edit mode.
         * Can be any of these values:
         *  Desktop       Mobile
         *  - Manual    -> N/A
         *  - Mousedown -> Touchstart
         *  - Click     -> Touchstart
         *  - Db click  -> Touchstart
         */
        setEditModeTrigger : function(trigger) {
            var self = this,
                trigger = trigger || 'manual';

            // Do not add listener on read only components
            if (this.opts.readOnly) {
                return;
            }

            // Check if desktop trigger is supported
            if (SUPPORTED_EDIT_TRIGGERS.indexOf(trigger) === -1) {
                Logger.error('EditableComponent: trigger not supported', trigger);
                return;
            }

            // Stopping propagation prevents both events from firing
            // Only touchend OR click is fired
            var _onTouchStart = function(e) {
                e.stopPropagation();
            };

            // Detect swipe/slide movements
            var move = false;
            var _onTouchMove = function(e) {
                e.stopPropagation();
                move = true;
            };

            // Callback to be triggered only once on touch event or click
            var _onTrigger = function(e) {
                var isTouchEndCancelable = (e.type === 'touchend' && e.cancelable),
                    isTrigger = (e.type === trigger);
                // List support for remove row action
                if (!self.opts.enableEditMode && !$(e.target).hasClass('editor-cta')) {
                    if (isTouchEndCancelable || isTrigger) {
                        e.preventDefault();
                    }
                    if (!self.opts.eventCapturingPhase) {
                        e.stopPropagation();
                    }
                    if ((isTouchEndCancelable && !move && !e.returnValue) || isTrigger) {
                        self.enableEditMode(true);
                    }
                    move = false;
                }
            };

            // Ghost click solution compatible for desktop-surface-tablet-mobile
            if (trigger !== 'manual') {
                // NOTE: removing old trigger not supported because it is not currently
                //       needed (no change of trigger on execution is done)
                // Remove old binding
                // var oldTrigger = this.opts.editModeTrigger;
                // this.$view.removeClass(EDITABLE_CLASS_PREFIX + '-' + oldTrigger);

                // if (self.opts.eventCapturingPhase) {
                //     this.$view[0].removeEventListener('touchstart', _onTouchStart, true);
                //     this.$view[0].removeEventListener('touchend', _onTrigger, true);
                //     this.$view[0].removeEventListener(oldTrigger, _onTrigger, true);
                // } else {
                //     self.$view.off('touchstart');
                //     self.$view.off('touchend');
                //     this.$view.off(oldTrigger);
                // }

                // Bind trigger
                this.$view.addClass(EDITABLE_CLASS_PREFIX + '-' + trigger);

                // Event binding
                if (self.opts.eventCapturingPhase) {
                    // Use event capturing phase to process the event, only supported in IE>9
                    this.$view[0].addEventListener('touchstart', _onTouchStart, true);
                    this.$view[0].addEventListener('touchmove', _onTouchMove, true);
                    this.$view[0].addEventListener('touchend', _onTrigger, true);
                    this.$view[0].addEventListener(trigger, _onTrigger, true);
                } else {
                    // Normal event binding
                    this.$view.on('touchstart', _onTouchStart);
                    this.$view.on('touchmove', _onTouchMove);
                    this.$view.on('touchend', _onTrigger);
                    this.$view.on(trigger, _onTrigger);
                }
            }

            // Store used trigger
            this.opts.editModeTrigger = trigger;
        },
        /**
         * Activates the edit mode from this component and all its children
         * Only the trigger component should be root
         *
         * @param  {event} triggerEvent  trigger event comming from the browser, this parameter
         *                               is optional
         */
        activateEditMode : function(eventInfo) {
            this.$view.addClass(EDITABLE_ROOT);

            EditableComponent.closeOthers(this.$view[0]);

            this.listenDescendantsEvents();

            this.callRecursively('displayEditMode', eventInfo);

            // Set the focus in the current component
            this.focus();
        },
        /**
         * Deactivates the edit mode from this component and all its children
         */
        activateViewMode : function(eventInfo) {
            // We cannot simply render the view mode .
            // We need to validate first if the data entered is valid
            var errors = this.validate();

            // If this control should always be editable then we do not try to
            // switch to view mode
            if (this.opts.alwaysEditable && !this.opts.readOnly) {
                return false;
            }

            var activateSuccesful = !errors || errors.length === 0;

            if (activateSuccesful) { // @TODO : What happens when we are initializing and the is no data to commit?
                this.$view.removeClass(EDITABLE_ROOT);
                this.removeDescendantListeners();
                // Commit changes recursively bottom-top
                // Check each children emptiness simultaneously
                this.cascadeStateChange(eventInfo);
            }

            return activateSuccesful;
        },
        /**
         * Custom actions done on cascadeStateChange for emptiness flow
         * - Control editable view mode based on empty state
         * @param {boolean} isEmpty : final emptiness state
         */
        onCascadeCheckEmptiness : function(isEmpty) {
            var isEmpty = this._super.apply(this, arguments);

            // Deactivates the edit mode
            this.displayViewMode(isEmpty);

            // Trigger commit event (notify data changes)
            this.fireEventAndNotify(EditableComponent.EV.COMMIT);

            return isEmpty;
        },
        /**
         * Builds the view mode
         * This method should be overwritten in child classes.
         * The only responsability of this class is to generate and show the
         * view mode, the validation and submittion of the data is handled by other classes
         * @param boolean isEmpty emptiness state
         */
        displayViewMode : function(isEmpty) {
            if (typeof isEmpty !== 'boolean') {
                Logger.error('displayViewMode : isEmpty state boolean required', isEmpty);
            }

            log('EditableComponent: Switching to displayViewMode');
            this.$view.removeClass(EDITING_CLASS_PREFIX);
            this.opts.enableEditMode = false;
            return this.displayOnEmpty(isEmpty);
        },
        /**
         * Detect editable emptiness
         * On true: add empty styles and trigger event
         */
        displayOnEmpty : function(isEmpty) {
            if (typeof isEmpty === 'undefined') {
                Logger.warn('displayOnEmpty : isEmpty state boolean required');
            }

            this.$view.toggleClass(EDITABLE_EMPTY, isEmpty);
            this.setEmptiness(isEmpty);

            // Trigger empty data event
            if (isEmpty) {
                this.fireEvent(EditableComponent.EV.DATA_EMPTY, this);
            }

            return isEmpty;
        },
        /**
         * Builds the edit mode
         * This method should be overwritten in child classes
         * The only responsability of this class is to generate and show the
         * edit mode, the validation and submittion of the data is handled by other classes
         */
        displayEditMode : function() {
            if (!this.opts.enableEditMode) {
                log('EditableComponent: Switching to displayEditMode');
                this.$view.addClass(EDITING_CLASS_PREFIX);
                this.opts.enableEditMode = true;
            }
        },
        /**
         * Method to set the focus in the current component
         */
        focus : function() {
            var firstElem = Util.getFirstElemFromObject(this.getComponents());
            if (firstElem) {
                var compDef = firstElem.value,
                    compInst = compDef.inst;
                if (compInst.focus) {
                    compInst.focus();
                    this.fireEventAndNotify(EditableComponent.EV.FOCUS);
                }
            }
        },
        /**
         * Validates the current editable component
         *
         * This method is responsible for showing the error in the right place
         *
         * @return mixed null if there is no error, otherwise, an array
         * of the error that were found
         */
        validate : function(recursive, displayEditModeOnErrors) {
            var errors = null;

            // If the flag is undefined then defaults to true
            displayEditModeOnErrors = displayEditModeOnErrors === undefined ?
                                        true :
                                        displayEditModeOnErrors;

            if (recursive !== false) {
                var childrenErrors = this.callRecursively({ flatten : true }, 'validate', false, false);
                errors = $.grep(childrenErrors,function(n) { return n; });

                // Activates the edit mode IF
                if (errors &&
                    // There are errors to show
                    (errors.length > 0) &&
                    // We want to display them
                    displayEditModeOnErrors &&
                    // Is not currently in edit mode
                    !this.opts.enableEditMode) {

                        this.activateEditMode();
                }
            }
            return errors;
        },
        /**
         * This method is called whenever a children trigger an intent to submit. This applies
         * when the component is operating in edit mode
         */
        descendantSubmitted : function(component) {
            if (component.isDescendantOf(this)) {
                this.activateViewMode();
            }
        },
        /**
         * Listen the children events such as submittion
         */
        listenDescendantsEvents : function() {
            this.removeDescendantListeners();

            this.listenDescendantEventsCallback = $.proxy(this.descendantSubmitted, this);
            this.backbone.on(EditableComponent.EV.INTENT_TO_SUBMIT, this.listenDescendantEventsCallback);
        },
        /**
         * Removes the listeners added in listenForChildrenEvents
         */
        removeDescendantListeners : function() {
            if (this.listenDescendantEventsCallback) {
                this.backbone.off(EditableComponent.EV.INTENT_TO_SUBMIT, this.listenDescendantEventsCallback);
            }
        }
    });

    EditableComponent.classMembers({
        EV : {
            FOCUS : 'focus',
            CHANGED : 'changed',
            DATA_EMPTY : 'dataEmpty',
            INTENT_TO_SUBMIT : 'intentToSubmit',
            EDIT_MODE_ACTIVATED : 'editModeActivated',
            DISPLAY_MODE_ACTIVATED : 'displayModeActivated',
            COMMIT : 'editableCommit'
        },
        /*
          Closes other containers except one related to passed element.
          Other containers can be cancelled or submitted (depends on onblur option)
        */
        closeOthers : function(element) {
            $('.' + EDITABLE_ROOT).each(function(i, el) {
                // do nothing with passed element and it's children
                if (el === element || $(el).find(element).length) {
                    return;
                }

                //otherwise cancel or submit all open containers
                var $el = $(el),
                    editable = $el.data(ELEM_DATA_KEY);

                if (!editable) {
                    return;
                }

                // Only if the editable container has valid data then disable edit mode
                // Deactivates the edit mode in each container
                editable.enableEditMode(false);

                // if(ec.options.onblur === 'cancel') {
                //     $el.data('editableContainer').hide('onblur');
                // } else if(ec.options.onblur === 'submit') {
                //     $el.data('editableContainer').tip().find('form').submit();
                // }
            });
        },
        /**
         * Attach events handlers that will close editable components on click / escape
         * todo: remove classes from js library class
         */
         _onDocumentClick : function(e) {
            var $target = $(e.target), i,
                exclude_classes = ['.editable-container',
                                   '.ui-datepicker-header',
                                   '.ui-datepicker-calendar',
                                   '.ui-datepicker',
                                   '.datepicker', //in inline mode datepicker is rendered into body
                                   '.modal-backdrop',
                                   '.select2-drop',
                                   '.list-row'
                                   ];

            //check if element is detached. It occurs when clicking in bootstrap datepicker
            if (!$.contains(document.documentElement, e.target)) {
                return;
            }

            //for some reason FF 20 generates extra event (click) in select2 widget with e.target = document
            //we need to filter it via construction below. See https://github.com/vitalets/x-editable/issues/199
            //Possibly related to http://stackoverflow.com/questions/10119793/why-does-firefox-react-differently-from-webkit-and-ie-to-click-event-on-selec
            if ($target.is(document)) {
                return;
            }

            //if click inside one of exclude classes --> no nothing
            for (i = 0; i < exclude_classes.length; i++) {
                if ($target.is(exclude_classes[i]) || $target.parents(exclude_classes[i]).length) {
                    return;
                }
            }

            //close all open containers (except one - target)
            this.closeOthers(e.target);
        },
        closeOnDocumentClick : function() {

            var self = this;

            //attach document handler to close containers on click / escape
            if (!self.documentEventsAttached) {
                //////////////////////////
                // BEGIN HULI CODE
                //////////////////////////
                /**
                 * REMOVED CLOSE WITH ESCAPE
                 * Several issues happening on complex editors
                 * - No validations running on close
                 * - Inner editors self-close not with the parent complex editor
                 */
                // document.addEventListener('keyup', function (e) {
                //     if (e.which === 27) {
                //         self.closeOthers(e.target);
                //         $('.editable-open').editableContainer('hide');
                //         //todo: return focus on element
                //         //
                //     }
                // }, true);
                //////////////////////////
                // END HULI CODE
                //////////////////////////

                // Close containers when click outsideing
                // (ghost click solution compatible for desktop-surface-tablet-mobile)
                document.addEventListener('touchstart', function(e) {
                    e.stopPropagation();
                }, true);
                document.addEventListener('touchend', $.proxy(this._onDocumentClick, this), true);
                document.addEventListener('click', $.proxy(this._onDocumentClick, this), true);

                self.documentEventsAttached = true;
            }
        }
    });

    // Contact Exporting module
    return EditableComponent;

});
