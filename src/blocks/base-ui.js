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
 * Base component specific for UI components
 * > UI Stateful Base / Base with data
 *   - Emptiness check support
 *   - Read only support
 *   - Visibility support
 *
 * @todo consider renaming this class to base-with-data
 *       and moved all data management to this class
 */
define([
            'jquery',
            'ju-components/base',
            'ju-components/util'
        ],
        function(
            $,
            BaseComponent,
            ComponentUtil
        ) {

    'use strict';

    // DOM properties and classes to manipulate
    var READONLY_CLASS_PREFIX = 'read-only';

    var BaseUIComponent = BaseComponent.extend({
        init : function() {

            this.setOptions({
                readOnly : false,
                visible : true,
                visibleOnEmptyData : true
            });

            this._super.apply(this, arguments);

            this.k = {
                dataEmpty : 'data-empty'
            };
        },
        setup : function() {
            if (this.opts.readOnly) {
               this.setOption('readOnly', true, true);
            }
            this._super.apply(this, arguments);

            this.toggleReadOnlyMode(this.$view);
            this.toggleVisibility();
        },
        /**
         * On state changes (ie: edit-to-view, set data, toggle visibility), a recursive call is run through
         * its children, each returns a standard result object (stateChangeResult) so the parent can react
         * based on retrieved data from the results (ie: emptiness check, block display, commit).
         *
         * RESULTS PROCESSING (aka. result transformation)
         *  - onCascadeCheckEmptiness : determines this component emptiness state
         *
         * @abstract must call wanted result transformations
         * @warning do not call _super on this method
         * @return {object} stateChangeResult
         */
        cascadeStateChange : function(eventInfo) {
            var self = this;

            var childrenRecursiveOpts = {
                callLocally : function(comp) {
                    // We only call the cascadeStateChange method again for this instance
                    // otherwise we would cause an infinite loop
                    return comp !== self;
                },
                callOnChildren : function(comp) {
                    // We only call the cascadeStateChange method on the children if the cascadeStateChange method
                    // does not exists in the current component.
                    // The cascadeStateChange method is recursive by nature, this is why we prevent
                    // duplicate recursive calls
                    return comp === self || comp.cascadeStateChange === undefined;
                }
            };

            // Seek if any inner child reports as not empty
            var results = self.callRecursively(childrenRecursiveOpts, 'cascadeStateChange', eventInfo),
                results = results.components;

            // Transform children results to a key : { result } format
            // for easier access on callback actions
            var childrenResults = {};
            for (var k in results) {
                childrenResults[k] = results[k].data;
            }

            /*** RESULTS TRANSFORMATIONS ***/

            // Determines this component emptiness state
            // @hook onCascadeCheckEmptiness
            // @see  base-ui
            var isEmpty = this.onCascadeCheckEmptiness(childrenResults);

            // Standard state change result object
            // @see base-ui
            return this.stateChangeResult({
                isEmpty : isEmpty
            });
        },
        /**
         * On cascadeStateChange, extract or determine this component emptiness state
         * based on returned children results. Let subclasses handle state changes
         * Subclasses must called _super to get emptiness state and bypass it back
         * @param {boolean} isEmpty : final emptiness state
         */
        onCascadeCheckEmptiness : function(childrenResults) {
            var isEmpty = true; // asume is empty by default

            // Determines emptiness state based on children results
            // @hook checkLocalEmptiness
            // @see  base-ui
            isEmpty = this.checkLocalEmptiness(childrenResults);

            return isEmpty;
        },
        /**
         * Standard object returned by a cascadeStateChange method
         * - inst    {Object}  reference to current component
         * - isEmpty {boolean} emptiness state (by default true)
         */
        stateChangeResult : function() {
            return this.composeResultObject(arguments, BaseUIComponent.RESULT_DEFAULT_OBJECTS.STATE_CHANGE);
        },
        /**
         * Transform value based on visibility
         */
        getData : function() {
            var value = this._super.apply(this, arguments);

            return (this.opts.visible) ? value : undefined;
        },
        /**
         * Sets the data of the current component plus the values of the children components
         * @return {object}
         *   - success : {bool} set succesful
         * @warn DO NOT call _super on this method
         */
        setData : function(data /* , extraDataFromParent */) {
            var self = this,
                setSuccessfull = false,
                isEmpty = self.opts.visible, // asume emptiness based on visibility
                results = {};

            if ($.isPlainObject(data)) {
                if (self.components) {
                    if (Object.keys(self.components).length > 0) {
                        $.each(self.components, function(key, compDef) {

                            // Key is the children key and value is the component object
                            var value = data[key];

                            if (compDef) {
                                var compInst = compDef.inst,
                                    extraData;

                                // If the component implements a extractParentData
                                // then we call it to extract
                                if (compInst.extractParentData) {
                                    extraData = compInst.extractParentData(data);
                                }

                                var result = compInst.setData(value, extraData) || setSuccessfull;

                                if (typeof result !== 'object') {
                                    Logger.error('base-ui : setData : setData must resturn a setDataResult object', result);
                                }

                                setSuccessfull = result.success;

                                results[key] = result;

                                // Unassing the data from the original object
                                // When the getData is called, then value for that key will be
                                // fetched from the child component
                                data[key] = null;
                                delete data[key];
                            }
                        });
                    } else {
                        // If component has no children, then it is a leaf node
                        // Set data is done at the top class
                        setSuccessfull = true;
                    }
                }
            } else {
                // If data is not an object, then a primitive or empty value is set
                // Set data is done at the top class
                setSuccessfull = true;
            }

            // Assign the data to the current model
            self.model = data;

            // Standard result state
            var result = {
                success : setSuccessfull
            };

            // Define emptiness based on visibility
            if (!self.opts.visible) {
                isEmpty = true;
                result.isEmpty = isEmpty;
                self.setEmptiness(isEmpty);

                // Standard set data result object
                // @see base-ui
                return self.setDataResult(result);
            }

            // @hook checkLocalEmptiness
            // @see  base-ui
            var localEmptiness = self.checkLocalEmptiness(results);

            if (typeof localEmptiness === 'boolean') {
                isEmpty = localEmptiness;
                result.isEmpty = isEmpty;
                self.setEmptiness(isEmpty);
            } else if (localEmptiness instanceof Promise) {
                result.promise = localEmptiness.then(function(isLocalEmpty) {
                    return self.setEmptiness(isLocalEmpty);
                });
            }

            // Standard set data result object
            // @see base-ui
            return self.setDataResult(result);
        },
        /**
         * Standard object returned by a setData method
         * - inst    {Object}  reference to current component
         * - promise {Promise} setData will resolve emptiness async way
         * - isEmpty {boolean} emptiness state
         * - success {boolean} set data failed or succeded
         */
        setDataResult : function() {
            // 'promise' and 'isEmpty' should not be included as default due to their optional nature
            return this.composeResultObject(arguments, BaseUIComponent.RESULT_DEFAULT_OBJECTS.SET_DATA);
        },
        /**
         * Options manager
         */
        setOption : function(option, value, recursive) {
            switch (option) {
                case 'readOnly':
                    this.onReadOnly(value);
                    break;
            }
            this._super.call(this, option, value, recursive);
        },
        /**
         * Read only
         */
        onReadOnly : function(readOnly) {
            this.opts.readOnly = readOnly || false;

            // Add read only to editable element
            if (this.t.$editableWrapper) {
                this.toggleReadOnlyMode(this.t.$editableWrapper);
            }

            // Add read only to component container
            if (this.$view !== null) {
                this.toggleReadOnlyMode(this.$view);
            }
        },
        toggleReadOnlyMode : function(view) {
            if (view && this.opts.readOnly) {
                view.toggleClass(READONLY_CLASS_PREFIX, this.opts.readOnly);
            }
        },
        /**
         * Visibility
         */
        onVisibility : function(visible) {
            // Store visibility for logics
            this.opts.visible = visible;

            // Change visibility
            this.$view.toggleClass(BaseUIComponent.HIDDEN, !visible);
        },
        toggleVisibility : function(show) {
            show = (typeof show !== 'undefined') ? show : this.opts.visible;
            this.onVisibility(show);
        },
        /**
         * Checks children emptiness state
         * Can be overwritten to customize edge emptiness check strategies-flows
         * @param {array|object|boolean} childrenEmptiness set of children emptiness information
         * @abstract
         */
        checkLocalEmptiness : function(childrenEmptiness) {
            var self = this,
                // some checkLocalEmptiness childrenEmptiness is a boolean (resolved emptiness, like in lists)
                // assume empty by default
                emptyState = (typeof childrenEmptiness === 'boolean') ? childrenEmptiness : true,
                childrenEmptinessPromisesArray = [];

            // Let custom option callback define emptiness
            // Custom option is provided to avoid inheritance, formerly known as call-box
            // @warn avoid using this callback, try overwriting method or options
            if ('function' === typeof this.opts.checkEmptiness) {
                var checkFn = this.opts.checkEmptiness;
                return checkFn.apply(checkFn, [this].concat([].slice.call(arguments)));
            }

            // Iterables (arrays and objects)
            for (var i in childrenEmptiness) {
                var childResult = childrenEmptiness[i];

                if ($.isPlainObject(childResult)) {
                    var childEmptinessPromise = childResult.promise,
                        childIsEmpty = childResult.isEmpty,
                        childEmptinessUndefined = (typeof childIsEmpty === 'undefined');

                    // promise can be undefined
                    // isEmpty can be undefined
                    // ..but promise AND isEmpty can't be processed
                    if (typeof childEmptinessPromise === 'undefined' && childEmptinessUndefined) {
                        Logger.error('base-ui : checkLocalEmptiness : unkown empty state or promise', childResult);
                    }

                    // Verify first if there is any unresolved promise
                    // Unresolved promise shouldnt affect emptyState
                    // Do not break, we need to figure out if there is any unresolved promised
                    if (childEmptinessPromise) {
                        childrenEmptinessPromisesArray.push(childEmptinessPromise);
                    // If not, then check for false emptiness
                    } else if (childIsEmpty === false) {
                        emptyState = false;
                    }

                    // Keep as empty only if current child is empty or unknown,
                    // plus there is no pending promised and no other child reported itself as not empty
                    if ((childIsEmpty === true || childEmptinessUndefined) && !childEmptinessPromise && emptyState) {
                        emptyState = true;
                    }
                } else {
                    Logger.error('base-ui : checkLocalEmptiness : child emptiness is not an object >', i, childrenEmptiness, childResult);
                }
            }

            // Check first if any child mark itself as not empty
            // Quicker than resolving any promise
            var hasPendingPromises = (childrenEmptinessPromisesArray.length > 0);

            if (hasPendingPromises) {
                // Even if we know that emptyState === false for any child
                // We will resolve this emptiness check after promises are resolved too
                // Resolved promise callback considers emptiness check result (emptyState)
                var allChildrenEmptiness = Promise.all(childrenEmptinessPromisesArray),
                    chainAllChildrenEmptiness = allChildrenEmptiness.then(function(results) {
                        var isLocalEmpty = self.checkLocalEmptiness(results[0]);
                        // Empty if promise results are empty and outter result is empty too
                        return emptyState && isLocalEmpty;
                    });
                return chainAllChildrenEmptiness;
            }

            return emptyState;
        },
        /**
         * Checks data emptiness
         * @abstract
         */
        isEmptyData : function(data) {
            return ComponentUtil.isEmptyObject(data);
        },
        /**
         * Set emptiness class on current component
         * @param  {boolean} isEmpty emptiness state
         * @return {boolean} isEmpty processed emptiness state
         */
        setEmptiness : function(isEmpty) {
            // Visible
            if (!this.opts.visible) {
                isEmpty = true;
            }

            // If set data result object is pass
            if (typeof isEmpty === 'object') {
                isEmpty = isEmpty.isEmpty;
            }

            // Visible on empty data
            if (!this.opts.visibleOnEmptyData) {
                this.$view.toggleClass(this.k.dataEmpty, isEmpty);
            }

            return isEmpty;
        }
    });

    BaseUIComponent.classMembers({
        HIDDEN : 'hidden',
        /**
         * Standard Result Objects
         * Default variables values
         * @warning dont use objects as default value
         * @todo update all references to default values
         */
        RESULT_DEFAULTS : {
            isEmpty : true,
            success : false
        },
        /**
         * Compose a default standard result object object
         * @warning must be function to avoid external overwrites
         * (don't direct reference to default variable values, neither object)
         * @todo add support for list of keys as array (on first argument)
         */
        getResultDefaultObject : function() {
            var resultDefaultObject = {};

            for (var i = 0, len = arguments.length; i < len; i++) {
                var key = arguments[i];
                resultDefaultObject[key] = BaseUIComponent.RESULT_DEFAULTS[key];
            }

            return resultDefaultObject;
        }
    });

    /**
     * Cached result default objects for use only with
     * composeResultObject as defaultResultObject param
     * @warning never store/assign a reference to this objects
     */
    BaseUIComponent.classMembers({
        RESULT_DEFAULT_OBJECTS : {
            SET_DATA : BaseUIComponent.getResultDefaultObject('success'),
            STATE_CHANGE : BaseUIComponent.getResultDefaultObject('isEmpty')
        }
    });

    return BaseUIComponent;
});
