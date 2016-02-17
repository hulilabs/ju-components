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
 * List of items component
 * @abstract - this component does not define an insertionPoint for each list item
 */
define([
            'require',
            'ju-components/blocks/base-ui'
        ],
        function(
            require,
            BaseUIComponent
        ) {

    'use strict';

    /**
     * Represents a list of the same component type
     * Each component will have a dictionary of children components
     */
    var ListComponent = BaseUIComponent.extend({
        init : function() {

            this.setOptions({
                // max number of children
                maxChildren : null,
                // Custom child listeners
                childListeners : [],
                // Skip when get data is undefined
                skipFieldOnUndefined : false,
                // Callback for verifying data emptiness
                // Implemented due to lists promises behavior on addChild
                checkDataEmptiness : null,
                // should trigger an event when the async `setData` operation ends?
                // see `addChild` and `setData` for more details
                triggerOnSetDataEnd : false,
                // provide a function that returns a boolean to use it
                // to keep the list's elements sorted
                sortBy : null,
                // Always editable
                // Makes this list always editable by default, which would create an empty element at the
                // beginning of the list
                alwaysEditable : false
            });

            this._super.apply(this, arguments);

            this.setChildrenDefinition({template : this.opts.template});

            // Holds a reference to the children component instances
            this.listDict = {};
            this.listDictCount = 0;
            this.sortedChildList = [];

            // Auto incrementing counter to assign ids to the list components
            this.nextComponentId = 1;

            // during child add flow, this can be set to true
            // by calling `preventChildAdd`
            this._preventChildAdd = false;

            // If the always editable flag is on then a default item should be added
            this.hasDefaultItem = true;
            this.defaultItemId = null;
            this.defaultItemShouldBeDeleted = false;
        },

        setup : function() {
            this._super.apply(this, arguments);

            if (this.opts.alwaysEditable) {
                this.addChild();
            }
        },

        fetchChildrenComponents : function(parentComponent, loadArgs, childrenExtendedOpts) {
            this.loadArgs = loadArgs;
            this.childrenExtendedOpts = childrenExtendedOpts || {};
            return this._super.apply(this, arguments);
        },
        /**
         * Return currently count of added children
         */
        getChildrenCount : function() {
            return this.listDictCount;
        },
        /**
         * Checks if count of children reached max number allowed
         * if maxChildren is null, then never check this
         */
        isMaxChildrenReached : function() {
            return (this.opts.maxChildren && this.getChildrenCount() >= this.opts.maxChildren);
        },
        notifyMaxChildrenReached : function() {
            if (this.isMaxChildrenReached()) {
                this.fireEventAndNotify(ListComponent.EV.MAX_CHILDREN_REACHED);
            }
        },

        /**
         * Triggers a `BEFORE_ADD_CHILD` event and if one of the listeners calls
         * `preventDefault`, the list will stop the current `addChild` operation
         * @param  {Object} data to be added
         * @return {Boolean}
         */
        canAddChild : function(data) {

            var addChildEvent = {
                target : this,
                data : data,
                preventDefault : $.proxy(this.preventChildAdd, this)
            };

            this.trigger(ListComponent.EV.BEFORE_ADD_CHILD, addChildEvent);

            if (this._preventChildAdd) {

                // resets flag to make sure that future `addChild`
                // can continue normally
                this._preventChildAdd = false;
                return false;
            }
            // NOTICE: this is a fallback to previous canAddChild implementation
            // TODO: this `isMaxChildrenReached` should be moved to a behavior binder
            return !this.isMaxChildrenReached();
        },

        // exposed setter to be used as `preventDefault`
        // to stop a `child add` operation
        preventChildAdd : function() {
            this._preventChildAdd = true;
        },

        notifyChildNotAdded : function() {
            this.fireEventAndNotify(ListComponent.EV.CHILD_NOT_ADDED, arguments);
        },
        /**
         * Method to add a new child component instance into the list
         */
        addChild : function(data, enableChildEditMode) {
            if (this.canAddChild(data)) {
                if (!this.opts.triggerOnSetDataEnd) {
                    return this.addChildAsPromised.apply(this, arguments);
                } else {
                    return {
                        componentId : null,
                        promise : (new Promise($.proxy(this.addChildAsPromised, this, data, enableChildEditMode)))
                    };
                }
            } else {
                this.notifyChildNotAdded.apply(this, arguments);
                return false;
            }
        },
        /**
         * Executes addChild operation
         * Adds a new child component instance into the list, with support
         * for a `resolve` argument, so it can be called inside of a promise
         *
         * @param {object} data      data to set into child
         * @param {boolean} enableChildEditMode forces child edit mode to be enabled
         * @param {function} resolve optional `resolve` callback for a promise
         */
        addChildAsPromised : function(data, enableChildEditMode, resolve, insertionPoint) {
            // debugger;
            var self = this;
            insertionPoint = insertionPoint || this.insertionPoint;

            // require([componentPath], function (ComponentClass) {

            // Generate a unique ID for this component
            var componentId = self.getNextComponentId(),
                // We store this flag locally for later reference in the
                // promise callback, because the value in the instance
                // can change before the callback gets executed
                isSettingData = this.isSettingData;

            log('ListComponent: Assigning new ID to child ', componentId);

            var template = self.c('template');

            if (!template) {
                Logger.error('ListComponent: Child template definition is not valid.');
                return;
            }

            // Retrieves the class from the template instance
            var ComponentClass = template._class,
                // Component instance ready
                compInst = new ComponentClass(template.opts);

            self.hasDefaultItem = self.hasDefaultItem && self.opts.alwaysEditable;

            if (!self.hasDefaultItem && self.listDict[self.defaultItemId]) {
                self.listDict[self.defaultItemId].setAsListDefaultItem(false);
                self.defaultItemId = null;
            }

            if (self.hasDefaultItem) {
                this.defaultItemId = componentId;
            }

            // Set the parent component of the instance as the list itself
            compInst.setParentComponent(self);

            // Store list id on child
            compInst.parentListID = componentId;

            if (compInst.extractOwner) {
                /* The item owner is required to be set before the component is setup.
                 * It is used to handle certain permissions based on the doctor who owns the item.
                 * For example, see the documents section, where different documents belog to different doctors
                 * and in certain cases you will be able to download the file and in other dont.
                 */
                compInst.setOption('id_user_owner', compInst.extractOwner(data));
            }

            // Run the setup method of the instance
            var fetchChildrenPromise = compInst.fetchChildrenComponents(compInst, self.loadArgs, self.childrenExtendedOpts.template);

            var chainfetchChildrenPromise = fetchChildrenPromise.then(function() {

                    if (componentId == self.defaultItemId && self.defaultItemShouldBeDeleted) {
                        self.hasDefaultItem = false;
                        return;
                    }

                    // If there is any notification center defined then pass it to the newly created child
                    if (self.backbone) {
                        compInst.callRecursively('setBackbone', self.backbone);
                    }

                    if (self.opts.readOnly) {
                        // Only set read only recursevely when we want something to become
                        // read only with all its childrens. If we run this also when self.opts.readOnly
                        // is false we might run into the case where there is a nested child
                        // whose default conf was to be read only and will become writable due to
                        // the setOption.
                        compInst.setOption('readOnly', self.opts.readOnly, true);
                    }

                    compInst.setup(insertionPoint);

                    if (self.hasDefaultItem && compInst.setAsListDefaultItem) {
                        compInst.setAsListDefaultItem(self.hasDefaultItem);
                        self.hasDefaultItem = false;
                        self.defaultItemId = componentId;
                    }

                    // If there is no data and the component and the
                    // new component is editable or we want to force enable mode,
                    // then we should show the edit mode
                    var shouldEnableEditMode = compInst.enableEditMode && (!data || enableChildEditMode);

                    // sets data before enabling edit mode
                    var result = compInst.setData(data);

                    // listen child events
                    if (self.opts.childListeners.length > 0) {
                        self.attachChildListeners.call(self, compInst);
                    }

                    // Trigger edit mode
                    if (shouldEnableEditMode) {
                        compInst.enableEditMode(true);
                    }

                    // add component to list
                    self.listDict[componentId] = compInst;
                    self.listDictCount = self.listDictCount + 1;

                    if (!self.opts.sortBy) {
                        // unsorted, just add as the last child
                        self.sortedChildList.push(compInst);
                    } else {
                        self.sortAddedChild(compInst, isSettingData, data);
                    }

                    // We only fire the events when we are not setting data programatically to the component
                    if (!isSettingData) {
                        self.fireEventAndNotify(ListComponent.EV.CHILD_ADDED, compInst);
                    }

                    // Max children reached
                    self.notifyMaxChildrenReached();

                    // If resolve it pass, then conclude addChildPromise using resolve
                    if (resolve) {
                        return resolve(result);
                    }

                    return result;
                });

            return {
                componentId : componentId,
                promise : chainfetchChildrenPromise
            };
        },

        /**
         * Moves an added child to a position so it's sorted using a provided
         * `sortBy` function and `this.sortedChildList` array
         * This method is intented to be called right when the child is inserted
         * @param  {Object}        addedChild    new component added
         * @param  {Boolean}       isSettingData
         */
        sortAddedChild : function(addedChild, isSettingData /*, addedChildData*/) {
            // this is dummy sample sort function and it's what's expected
            // to arrive in `sortBy` opt
            // this.opts.sortBy = function(childDataToAdd, currentChildData) {
            //     if (childDataToAdd.someProperty >= currentChildData.someProperty) {
            //         return true;
            //     }

            //     return false;
            // };

            if ('function' === typeof this.opts.sortBy) {
                if (!isSettingData) {
                    this.moveChildToSortedPosition(addedChild);
                } else {
                    // inserts the child as the data was already committed
                    // and we assume that the array comes sorted from the server
                    this.pushChildIntoSortedList(addedChild, true);
                }
            }
        },

        /**
         * Performs the actual sorting of a child:
         * + Removes the child from sorted array if it's there
         * + Inserts it in the proper position
         *
         * Note that `insert as last` is handled in a special manner
         * and that sorting will always place the child before the one that's
         * currently in the index where `sortBy` opt function returns true
         * @param  {Object} addedChild Component instance of the child to sort
         */
        moveChildToSortedPosition : function(addedChild) {
            // checks if there are components in the sorted array already
            if (this.sortedChildList.length > 0) {
                // skips sorting when attempting to sort a child that's already in the list
                // and the list only have one element
                if (1 === this.sortedChildList.length && this.isChildInSortedArray(addedChild)) {
                    log('ListComponent: skipped sorting of list with only one element', addedChild);
                    return;
                }

                // removes child from sorted list if it's there
                this.removeChildFromSortedArray(addedChild);

                var sortFunction = this.opts.sortBy,
                    // tests if the element to add will be inserted before the last one
                    currentLastChild = this.sortedChildList[this.sortedChildList.length - 1],
                    // compares against the current tail
                    shouldInsertChildAtMiddle = sortFunction(addedChild, currentLastChild);

                // if the element should't remain as the last one
                // we insert it "in the middle".
                if (shouldInsertChildAtMiddle) {

                    var self = this,
                    // this flag will be set to true when we've found the correct index
                        shouldInsertChildBefore;

                    $.each(this.sortedChildList, function(index, child) {
                        shouldInsertChildBefore = sortFunction(addedChild, child);
                        if (shouldInsertChildBefore) {
                            self.insertChildAtIndex(index, addedChild);
                            // break
                            return false;
                        }

                        // iteration continues
                        return true;
                    });
                } else {
                    // inserts the child as the last in the list
                    this.pushChildIntoSortedList(addedChild);
                }

            } else {
                // adds child to empty array
                this.pushChildIntoSortedList(addedChild, true);
            }
        },

        /**
         * Handles 'insert as last' and 'insert in empty list' cases considering
         * if the child was already sorted or not
         * @param  {Object}  child       instance of component, child to sort
         * @param  {boolean} justPushIt  is the child the last already? just push it!
         */
        pushChildIntoSortedList : function(child, justPushIt) {
            // is the child already sorted if we insert it as last?
            if (justPushIt) {
                // updates the reference in the sorted array
                this.sortedChildList.push(child);
            } else {
                // an existing child that was edited to be the last
                // so we move it to the proper index
                this.insertChildAtIndex(this.sortedChildList.length, child);
            }
        },

        /**
         * For a sorted list, inserts a child in a certain index in `sortedChildList`
         * Note that it doesn't handle any view changes
         * @param  {int}     index
         * @param  {Object}  childToInsert Instance of component to insert
         */
        insertChildAtIndex : function(index, childToInsert) {
            // inserting a child as last element is a special case
            // this flag will say if we're going to do so
            var shouldInsertAsLast = this.shouldInsertAsLast(index);

            // checks if the child isn't the last using the previously set
            if (!shouldInsertAsLast) {
                // updates internal reference in sorted array
                this.sortedChildList.splice(index, 0, childToInsert);

            } else {
                // updates internal reference in sorted array
                this.sortedChildList.push(childToInsert);
            }

            log('ListComponent: child added at index', index, childToInsert);
        },

        /**
         * Inserting in a sorted list as last is a special case
         * this method returns true in that scenario
         * @param  {index} indexToInsertInto
         * @return {boolean}
         */
        shouldInsertAsLast : function(indexToInsertInto) {
            return (indexToInsertInto == this.sortedChildList.length);
        },

        /**
         * Removes the specified child and internal list
         */
        removeChild : function(compId) {
            var compInst = this.getChildInstFromDOM(compId),
                removedData = compInst.getData();

            log('ListComponent: removing child', compInst);

            // deletes child reference in sorted array
            this.removeChildFromSortedArray(this.listDict[compId]);

            // Destroying instance
            compInst.destroy();

            // Remove the instance from the list
            delete this.listDict[compId];
            this.listDictCount = this.listDictCount - 1;

            // We only fire the events when we are not setting data programatically to the component
            if (!this.isSettingData) {
                this.fireEventAndNotify(ListComponent.EV.CHILD_REMOVED, removedData);
            }

            // Check empty list
            this.emptyList();
        },

        /**
         * Removes the reference to a component that was stored in
         * this.sortedChildList
         * @param  {mixed} childCriteria  an index or a valid criteria for `getChildIndexInSortedArray`
         * @return {Object}       removed child (if any)
         */
        removeChildFromSortedArray : function(childCriteria) {
            // the index will be childCriteria if it's a number
            // or relies in `getChildIndexInSortedArray` otherwise
            var childIndex = 'number' === typeof childCriteria ?
                             childCriteria :
                             this.getChildIndexInSortedArray(childCriteria);

            // if the component was found in the array, it is returned
            return childIndex >= 0 ? this.sortedChildList.splice(childIndex, 1) : null;
        },

        /**
         * Obtains a child's index in this.sortedChildList
         * @param  {mixed} childCriteria  string for search by id, or object to search by component
         * @return {int}                  child index or -1 if not found
         */
        getChildIndexInSortedArray : function(childCriteria) {
            // as the component was provided, returns the index using native function
            if (null !== childCriteria && 'object' === typeof childCriteria) {
                return this.sortedChildList.indexOf(childCriteria);
            }

            // the provided field to obtain an index is the child's id
            if ('string' === typeof childCriteria) {
                var indexOfChild = -1,
                    componentId = childCriteria;

                $.each(this.sortedChildList, function(index, child) {
                    if (child.id == componentId) {
                        indexOfChild = index;
                        return false;
                    }
                    return true;
                });

                return indexOfChild;
            }

            // not a valid value was provided to search the child
            Logger.warn('ListComponent: invalid criteria to find sorted child', childCriteria, this.sortedChildList);
            return -1;
        },

        /**
         * Sugar method to know if a child is part of sorted child list
         * @param  {mixed}  child  see `childCriteria` argument in getChildIndexInSortedArray
         * @return {Boolean}
         */
        isChildInSortedArray : function(child) {
            return (this.getChildIndexInSortedArray(child) > -1);
        },

        /**
         * Clear the current items on the list
         */
        clear : function() {
            $.each(this.listDict, function(compId, compInst) {
                compInst.destroy();
            });

            this.listDict = {};
            this.listDictCount = 0;
            this.sortedChildList = [];

            // Process empty list
            this.emptyList();
        },
        /**
         * Process empty list
         */
        emptyList : function() {
            var isEmptyList = this.isEmptyList();
            if (isEmptyList) {
                // We only fire the events when:
                // - we are not setting data programatically
                // - we are not destroying this component (avoid being mark as changed)
                if (!this.isSettingData && !this.isDestroying) {
                    this.fireEventAndNotify(ListComponent.EV.CLEARED);
                }
            }

            return isEmptyList;
        },
        /**
         * Check if list is empty
         */
        isEmptyList : function() {
            return (this.listDictCount === 0);
        },
        /**
         * Add custom child listeners
         * @param {object} childCompInst child component instance
         */
        attachChildListeners : function(childCompInst) {
            for (var i in this.opts.childListeners) {
                var listenerDef = this.opts.childListeners[i];
                childCompInst.on(listenerDef.event, listenerDef.callback);
            }
        },
        /**
         * Add child listener on the fly
         */
        addChildListener : function(event, listener, attach) {
            var listenerDef = { event : event, callback : listener };
            this.opts.childListeners.push(listenerDef);

            // attach now or wait for other action
            if (attach) {
                $.each(this.listDict, function(compId, compInst) {
                    compInst.on(listenerDef.event, listenerDef.callback);
                });
            }
        },
        /**
         * Formats the numeric id. Used to retrieve or store
         * a component in the dictionary
         * @return {[type]} [description]
         */
        formatId : function(id) {
            return 'comp' + id;
        },
        /**
         * Returns the next id to be assigned to a new component
         * @return {string}
         */
        getNextComponentId : function() {
            var nextId = this.nextComponentId;
            this.nextComponentId++;
            return this.formatId(nextId);
        },
        /**
         * Returns the data of the current component plus the values of the children components
         * @return {object}
         */
        getData : function() {

            // Children data to export
            var childrenData = [],
                self = this;

            $.each(this.listDict, function(compId, compInst) {

                var compData = compInst.getData();

                if (self.opts.skipFieldOnUndefined) {
                    if (undefined !== compData) {
                        childrenData.push(compData);
                    }
                } else if (self.defaultItemId) {
                    if (compData) {
                        childrenData.push(compData);
                    }
                } else {
                    childrenData.push(compData);
                }
            });

            return childrenData;
        },
        /**
         * Sets the data of the current component plus the values of the children components
         */
        setData : function(data) {
            this.isSettingData = true;

            var results = BaseUIComponent.getResultDefaultObject('isEmpty','success'),
                checkDataEmptinessFn = this.opts.checkDataEmptiness;

            // Define emptiness for any scenario
            results.isEmpty = checkDataEmptinessFn ? checkDataEmptinessFn(data) : this.isEmptyData(data);

            // Ability of setting data is determined also by always editable behavior
            // - always editable enabled and empty array data: a default child was added in setup method
            // - not always editable, then only set data if data is an array (empty or not)
            var canSetData = results.success = ($.isArray(data) &&
                    ((this.opts.alwaysEditable && !results.isEmpty) || !this.opts.alwaysEditable));

            // Set non-empty array data
            if (canSetData) {
                // clear the current components
                this.clear();

                // Default item
                if (this.opts.alwaysEditable && this.defaultItemId) {
                    this.defaultItemShouldBeDeleted = true;
                    this.hasDefaultItem = false;
                }
                // tests if should trigger an event once done setting data
                if (!this.opts.triggerOnSetDataEnd) {
                    // Adds childrens normally, for every data member
                    // Return array of promises. Can be also false for not set child
                    var childrenSetDataPromiseArray = this.setChildrenData(data);
                    if ($.isArray(childrenSetDataPromiseArray)) {
                        results.promise = Promise.all(childrenSetDataPromiseArray);
                    }
                } else {
                    // uses promises to trigger SET_DATA_END once done
                    // Return single all-promise, resolved after all children are set
                    results.promise = this.setChildrenDataWithDoneTrigger(data);
                }
            } else if (this.opts.alwaysEditable) {
                // when a list has always editable enabled AND data is empty array or undefined
                // then no problem, a default placeholder child was added in setup method
                results.success = true;
            } else {
                Logger.error("ListComponent: cannot set data that isn't an array");
            }

            this.isSettingData = false;

            // Standard set data result object
            // @see base-ui
            return this.setDataResult(results);
        },
        /**
         * A base list is considered empty if the array-to-set is empty (no elements)
         * @param  {array}   data data to evaluate
         * @return {Boolean} emptiness state
         */
        isEmptyData : function(data) {
            return (!$.isArray(data) || data.length === 0);
        },
        /**
         * Adds a child for every member in data
         * @param {array} data
         */
        setChildrenData : function(data) {
            var self = this,
                childrenSetDataPromiseArray = [],
                listItemSetDataResult;

            $.each(data, function(index, value) {
                if (self.canAddChild(value)) {
                    listItemSetDataResult = self.addChild(value);
                    childrenSetDataPromiseArray.push(listItemSetDataResult.promise);
                } else {
                    self.notifyChildNotAdded(value);
                }
            });

            self.notifyMaxChildrenReached();

            // Return each promises to resolve or catch
            return childrenSetDataPromiseArray.length > 0 ? childrenSetDataPromiseArray : false;
        },
        /**
         * Adds a child for every member in data and triggers SET_DATA_END when done
         * @param {array} data
         */
        setChildrenDataWithDoneTrigger : function(data) {
            var self = this,
                childrenSetDataPromiseArray = [],
                listItemSetDataResult;

            // appends every child and stores a promise for each
            // note that this happens only because `triggerOnSetDataEnd` opt is enabled
            $.each(data, function(index, value) {
                if (self.canAddChild(value)) {
                    listItemSetDataResult = self.addChild(value);
                    childrenSetDataPromiseArray.push(listItemSetDataResult.promise);
                } else {
                    self.notifyChildNotAdded(value);
                }
            });

            // triggers SET_DATA_END event when all the childrens are done setting data, as promised
            var allChildrenSetData = Promise.all(childrenSetDataPromiseArray),
                chainAllChildrenSetData = allChildrenSetData.then(function(results) {
                    self.notifyMaxChildrenReached();
                    self.trigger(ListComponent.EV.SET_DATA_END);
                    return results;
                });

            // Return all-promise to resolve or catch
            return chainAllChildrenSetData;
        },

        /**
         * Executes a specific function for each children component of the current component
         * @param  {string} method name of the method to execute
         */
        eachChildrenComponents : function(method) {
            var returnData = null;

            if (this.listDict) {
                var args = Array.prototype.slice.call(arguments, 1);
                returnData = [];
                // Register children maps
                $.each(this.listDict, function(compId, compInst) {
                    // Iterate over all the components asking for the resources
                    if (compInst[method]) {
                        returnData.push(compInst[method].apply(compInst, args));
                    }
                });
            }
            return returnData;
        },
        /**
         * callRecursively helper
         * Implements children recursion over list dictionary
         */
        callChildrenRecursively : function(opts, args) {
            var results = opts.flatten ? [] : {};

            if (this.listDict) {
                var componentsResults = {};
                // Register children maps
                $.each(this.listDict, function(compId, compInst) {
                    var childrenResult = compInst.callRecursively.apply(compInst, args);

                    if (opts.flatten) {
                        results = results.concat(childrenResult);
                    } else {
                        componentsResults[compId] = childrenResult;
                    }
                });

                if (!opts.flatten) {
                    results.components = componentsResults;
                }
            }

            return results;
        },

        /**
         * Need to destroy all the items in the list
         */
        destroy : function() {
            this.isDestroying = true;
            this._super();
            // TODO: destroy all the components in the list as well
            this.clear();
        }
    });

    ListComponent.classMembers({
        EV : {
            CHILD_ADDED : 'childAdded',
            CHILD_NOT_ADDED : 'childNotAdded',
            CHILD_REMOVED : 'childRemoved',
            CLEARED : 'cleared',
            MAX_CHILDREN_REACHED : 'maxChildrenReached',
            SET_DATA_END : 'setDataEnd',
            BEFORE_ADD_CHILD : 'beforeAddChild'
        }
    });

    // Exporting module
    return ListComponent;

});
