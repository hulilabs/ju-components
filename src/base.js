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
            'jquery',
            'ju-shared/observable-class',
            'ju-shared/util',
            'ju-components/factory/base',
            'ju-components/helper/options',
            'ju-components/resource/resource-collector',
            'ju-components/resource/resource-manager',
            'ju-components/util',
            'ju-components/backbone',
            'ju-components/factory/single-instance'
        ],
        function(
            $,
            ObservableClass,
            Util,
            FactoryBase,
            OptionsHelper,
            ResourceCollector,
            ResourceManager,
            ComponentUtil,
            Backbone,
            SingleInstanceFactory
        ) {
    'use strict';

    /**
     * Base Constants
     */

    /*
        This is the path to the default error handler is no other is specified in opts using the
        key: errorHandler
     */
     var DEFAULT_ERROR_HANDLER_PATH = 'ju-components/blocks/error-handler/base',
     /*
        This is the path to the default spinner if no other is specified in opts using the
        key: spinner
      */
            DEFAULT_SPINNER_PATH = 'ju-components/blocks/spinner/inpage-spinner/spinner';

    /**
     * Basic building block for components.
     * Each component will have a dictionary of children components
     *
     * The flow of each component will be
     *
     * - fetchChildrenComponent
     * - fetchResources
     * - setup (at this point the insertion point is needed)
     *   - findLocalElems
     *   - bindEvents
     *
     *
     *
     * Example of base component children definition:
     *
     *
     *
     *
    CHILDREN_DEFINITION = {
        phones : {
            component : 'common/component/blocks/list-editable',
            insertionPoint : '.patient-phones',
            opts : {
                childrenDef : {
                    template : {
                        component : 'common/component/phone/editor',
                        opts : {
                            editModeTrigger : 'click'
                        }
                    }
                }
            },
            // The extended opts contains opts for the children at a deeper level
            // DISCLAIMER: Please use the extended only when you have two use cases
            //  of the exactly the same component but with slightly minor diferences
            // (i.e. such as configuring some extra params of a inner children)
            extendedOpts : {
                default : {
                    affiliations : {
                        template : {
                            id_insurance : {
                                opts : { }
                            }
                        }
                    }
                }
            }
        },
        email : {
            component : 'common/component/editable-input/simple-text',
            insertionPoint : '.patient-email',
            opts : {
                placeholder: '!@email_placeholder',
                emptytext : '!@email_placeholder',
            }
        },
        // id_province : {

        // },
        address : {
            component : 'common/component/editable-input/simple-text',
            insertionPoint : '.patient-address',
            opts : {
                placeholder: '!@address_placeholder',
                emptytext : '!@address_placeholder',
                validator : {
                }
            }
        }
    }
     *
     *
     *
     *
     */
    var BaseComponent = ObservableClass.extend({
        init : function(opts) {

            // Debug components counter
            window.compCounter = window.compCounter || 0;
            window.compCounter++;

            this.id = Util.getPseudoId('');

            // Flag that indicates if this component has a valid insertion point at definition
            // this.hasInsertionPoint = true;

            /**
             * Children components
             * @type list of format
             * {
             *     phones : < component object >,
             *     emails : < component object >
             * }
             */
            this.components = {};

            /**
             * Stores de model information for the current component
             * This model could store info in a standard or draft format
             */
            this.model = null;

            /**
             * Selectors for elements of this component
             */
            this.S = this.S || {};

            /**
             * Stores the tags for the current elem
             */
            this.t = {};

            /**
             * Stores a jQuery object pointing to the insertion point of this elem
             */
            this.$insertionPoint = null;

            /**
             * Stores the view where the templates will buildup and event binding will happen
             */
            this.$view = null;

            // Stores the children definition provided by the class that inherits from this
            this.childrenDef = null;

            // Resources definition
            this.resourcesDef = this.resourcesDef || {};

            // Root components flag
            this.isRootComponent = false;

            // Holds a reference to the parent component
            this.parentComponent = null;

            /**
             * Stores the options for this
             */
            this._initOptsManager();
            this.optsManager.prepareOptions(opts);
            this.opts = this.optsManager.getOptions();

            // Reference to the spinner
            this.spinnerComp = null;

            // temporary container for components detached using `detachChild`
            this.detachedComponents = {};
        },
        /**
         *
         * Loads the component own parts and the children parts.
         * Only the root component should call this method
         */
        load : function() {
            // Checks root component
            if (this.isRootComponent) {

                var self = this,
                    args = arguments;

                // Stores the insertion point
                if (!self.storeInsertionPoint.apply(self, arguments)) {
                    return;
                }

                // Activates the spinner
                self.toggleSpinnerVisibility(true);

                // Load the children components and then trigger
                var componentsFetchedPromise = self.fetchChildrenComponents(self, args);

                self.setupCompletedPromise = componentsFetchedPromise
                    // Wait for all the JS depedencies to load
                    .then(function() {

                        // At this point, all the JS dependencies of all the children components are loaded
                        // We now proceed to load the resources for all the components
                        log('Component: Ready to fetch resources of all components');

                        // Fetches the resources in a single request from the children components and itself
                        // At this point all the children components are ready in memory
                        return self.fetchResources();
                    })
                    // At this point we have all the children and their resources in memory,
                    // The root component always provides a backbone that will be a
                    // bus to communicate global events in all the components tree
                    // and also provide access to shared instances
                    .then(function() {
                        var backbone = new Backbone();
                        self.callRecursively('setBackbone', backbone);
                    })
                    // Wait for all the resources to load
                    .then(function() {
                        // Setup this component
                        // The order will be from top to bottom in the component tree
                        var result = self.setup.apply(self, args);
                        // This wil return a promise that will be chained in the lifecyle
                        return result;
                    })
                    // Insert virtual dom into dom (single insertion point)
                    .then(function(setupResult) {
                        self.appendToDOM();
                        self.fireEventAndNotify(BaseComponent.EV.DOM_READY);
                        return setupResult;
                    });

                // This catch will capture any error during the loading and setup process
                self.setupCompletedPromise
                ['catch'](function() {
                    Logger.error('Failed to load component', arguments);
                    self.toggleErrorVisibility(true, arguments);
                }).then(function() {
                    // Hides the spinner
                    self.toggleSpinnerVisibility(false);
                });

                return self.setupCompletedPromise;
            } else {
                Logger.error('Component: Child component is trying to fetch data in load');
            }
        },
        /**
         * Setups the component
         * We setup this component first and then continue with the children components
         * All the events bindings of this component will happen before we setup the children components. Using
         * this approach, we prevent that any jquery selector of this component will bind elements of the
         * children components
         */
        setup : function() {
            var self = this;

            // Stores the insertion point
            if (!self.storeInsertionPoint.apply(self, arguments)) {
                return;
            }

            // By default, the view will be the insertion point
            self.$view = self.$insertionPoint;

            // Translate all the labels that
            self.translateOptions();

            // Append the templates for the current component
            self.configureComponent();

            // Find local elements once the template have been loaded
            this._findLocalElems();

            // Bind events to the recently fetched templates
            this.bindEvents();

            // setup children
            this.childrenSetup.apply(this, arguments);

            this.trigger(BaseComponent.EV.READY);

            // Callback for custom internal logic when all the children
            // have been setup and are ready
            this.setupCompleted.apply(this, arguments);
        },
        /**
         * Stores the insertion point locally
         */
        storeInsertionPoint : function() {
            var $insertionPoint = arguments.length > 0 ? arguments[0] : null;

            // Validate parameters
            if (!$insertionPoint || !$insertionPoint.length) {
                Logger.error('Error: A component must have a valid insertion point.', this);
                return;
            }

            // Validate more than one insertion point
            if ($insertionPoint.length > 1) {
                Logger.error('Error: A component doesnt have a single insertion point.', $insertionPoint, this);
                return;
            }

            // Store the insertion point locally
            this.$insertionPoint = $insertionPoint;
            return $insertionPoint;
        },
        /**
         * Configures the children component definition, allows the component to determine
         * which components to load in a dynameic way using the parameter passed along
         * from the load function of the root component
         */
        initChildrenDef : function() { },
        /**
         * Translate the options object.
         * It will look
         */
        translateOptions : function() {
            // Skip specifc keys because we don't want to
            // go into other components options
            this.opts = ComponentUtil.processObjL10n(this.opts, ['opts', 'childrenDef', 'template']);
        },
        /**
         * Children definition safe-setter
         * @param {object} childrenDef standard children definitions
         */
        setChildrenDefinition : function(childrenDef) {
            childrenDef = childrenDef || {};
            // Clone definition to avoid direct references
            this.childrenDef = $.extend(true, {}, childrenDef);
        },
        /**
         * Setups the children components
         */
        childrenSetup : function() {
            var self = this,
                args = Array.prototype.slice.call(arguments, 1);

            // Register children maps
            $.each(self.components, function(key, childComp) {
                // Iterate over all the components asking for the resources
                var compInst = childComp.inst,
                    $childInsertionPoint = self.$view.find(childComp.insertionPoint);
                compInst.setup.apply(compInst, $.merge([$childInsertionPoint], args));
            });
        },
        /**
         * This method should be overwritten by the client in order to build the template for this component
         */
        configureComponent : function() { },
        /**
         * Find local elements. Holds reference to the local DOMS elements
         * Including those that will work as the insertion  point for the children components
         */
        _findLocalElems : function() {
            var self = this;
            if (this.S) {
                $.each(this.S, function(key, selector) {
                    var $elem = self.$view.find(selector);
                    if (!$elem.length) {
                        Logger.error('BaseComponent: could not find a DOM element with selector: ', selector);
                    }
                     self.t['$' + key] = $elem;
                });
            }
        },
        /**
         * Use a resource manager to fetch all the resources for all the children components
         * @return {[type]} [description]
         */
        fetchResources : function() {

            var self = this;

            // Register current resource map
            var collector = ResourceCollector.createInst();
            self.addResourceMapToCollector(collector);

            // At this point the collector will have all resources of the children
            var loadResourcesPromise = ResourceManager.getInst().loadResources(collector);

            // Distribute the resources ?

            // var promise = new Promise(function (resolve, reject) {
            //     // Once we have all the resources then we can start the component
            //     // initialization
            //     // We start the initialization from the outer container to the inner container
            // });
            log('Waiting for the resources to load...');
            return loadResourcesPromise;
        },
        /**
         * Callback when all the children have been setup and are ready
         * to be used
         */
        setupCompleted : function() { },
        /**
         * Initialize options manager
         * @see  OptionsHelper
         */
        _initOptsManager : function() {
            this.optsManager = this.optsManager || new OptionsHelper();
        },
        /**
         * Store options in manager
         * @decorator
         * @see  OptionsHelper
         */
        setOptions : function() {
            this._initOptsManager();
            this.optsManager.setOptions.apply(this.optsManager, arguments);
        },
        /**
         * Merge selectors into the selector dictionary (collector) used by _findLocalElems
         * @param {object}  selectorsObj selectors dictionary
         * @param {boolean} overwrite    overwrite stored selectors dictionary (forced)
         */
        setSelectors : function(selectorsObj, overwrite) {
            this.S = this.S || {};
            overwrite = !!overwrite || false;

            if (overwrite) {
                this.S = selectorsObj;
            } else {
                this.S = $.extend(true, {}, this.S, selectorsObj);
            }
        },
        /**
         * Merge specific resources to the component resource map
         *
         * var RESOURCE_MAP = {
         *     cssFile : [],
         *     l10n : [],
         *     template : [],
         *     optionsData : [],
         *     appConfig : [],
         *     context : {}
         * };
         */
        addResources : function(resourceMap) {
            // $.extend does not support nested arrays merge
            // this.resourcesDef = $.extend(true, {}, this.resourcesDef, resourceMap);
            // log('AddResources : extend', this, this.resourcesDef, resourceMap);

            if (resourceMap) {
                for (var k in resourceMap) {
                    if (resourceMap.hasOwnProperty(k)) {
                        this.resourcesDef = this.resourcesDef || {};
                        if (!this.resourcesDef.hasOwnProperty(k)) {
                            this.resourcesDef[k] = resourceMap[k];
                            log('AddResources : initialize', this, k, this.resourcesDef[k], resourceMap[k]);
                        } else {
                            for (var j in resourceMap[k]) { // jshint ignore:line
                                var keyName = resourceMap[k][j];
                                if ($.isArray(this.resourcesDef[k]) && this.resourcesDef[k].indexOf(keyName) === -1) {
                                    this.resourcesDef[k].push(keyName);
                                } else if ($.isPlainObject(this.resourcesDef[k])) { // context merge
                                    this.resourcesDef[k][j] = keyName;
                                }
                            }
                            log('AddResources : array merge', this, k, this.resourcesDef[k], resourceMap[k]);
                        }
                    }
                }
            }
        },
        /**
         * Recursive function that will register the resource map of all its children
         * We register the children maps because it's likely that the parent component will have styles that overwrites
         * children default styles
         */
        addResourceMapToCollector : function(resourceCollector) {

            var self = this;

            // Register children maps
            $.each(self.components, function(key, component) {
                log('Adding resources of component...', key, component);
                var compInst = component.inst;
                // Iterate over all the components asking for the resources
                compInst.addResourceMapToCollector(resourceCollector);
            });

            // Register current resource map
            if (self.resourcesDef) {
                log('Adding resources of parent component...', self, self.resourcesDef);
                resourceCollector.addResources(self.resourcesDef, self);
            }
        },
        /**
         *
         * This method will fetch the children components and load them into the local map
         * and then resolve the promise when all of the children are ready (that means will all of its children loaded as well)
         *
         */
        fetchChildrenComponents : function(parentComponent, loadArgs, childrenExtendedOpts) {
            var self = this;

            var childrenLoadedPromise = new Promise(function(resolve, reject) {

                var promise = self.initChildrenDef.apply(self, loadArgs);

                if (!promise) {
                    promise = Promise.resolve();
                }

                promise.then(function() {
                    if (!self.childrenDef) {
                        log('fetchChildrenComponents: No children defined...');
                        // Resolve inmediatelly as we dont have any children to load

                        resolve();
                    } else {
                        log('fetchChildrenComponents: Loading children def...', self.childrenDef);
                        // Loading
                        FactoryBase
                            .getInst()
                            .createInstances(self.childrenDef, parentComponent, loadArgs, childrenExtendedOpts)
                            .then(function(components) {
                                self.components = components;
                                resolve();
                            })
                            ['catch'](reject);
                    }
                });

                // Only when all the children have been fetched then we resolve the current promise
                // log('Only when all the children have been fetched then we resolve the current promise');
                // resolve
            });

            return childrenLoadedPromise;
        },

        /**
         * Bind the events of the local component
         */
        bindEvents : function() {

        },

        /**
         * Clear the current component
         */
        clear : function() {
        },

        /**
         * Appends the current element to this component view
         */
        appendToView : function(content, mergeWithView) {
            if (!content) {
                Logger.error('BaseComponent: cannot append empty content');
                return;
            }

            if (mergeWithView === undefined) {
                // For root component default to false
                // for any other level default to true
                mergeWithView = !this.isRootComponent;
            }

            if (this.isRootComponent) {
                // - Root view is changed into a virtual dom space (enables binding, tree traversal and manipulations)
                //   Insertion point will remain at root component as the only reference to the dom append point
                // - Children will receive virtual dom references at childrenSetup (insertion point and view)
                //   so all children are setup inside the virtual dom space too
                // - Final append to dom happens only the root level at setup completed point
                //   then all virtual dom (including children) are moved into the dom

                // Store mergeWithView on root component for future appendToDOM
                this.rootMergeWithView = mergeWithView;

                // Transform template html into virtual dom view
                this.$view = $(content);
            } else {
                if (mergeWithView) {
                    this._mergeViewWithContent(this.$view, content);
                } else {
                    // Simply append the content to the view
                    this.$view.append(content);
                }
            }
        },

        /**
         * Appends this component to the dom
         */
        appendToDOM : function() {
            if (this.isRootComponent) {
                if (this.rootMergeWithView) {
                    // Merge insertion point and virtual dom root
                    this._mergeViewWithContent(this.$insertionPoint, this.$view);
                } else {
                    // Simply append the content to the dom using initial insertion point
                    this.$insertionPoint.append(this.$view);
                }
            } else {
                Logger.error('appendToDOM : for optimal performance, only a root component can append directly to the dom at load');
            }
        },
        /**
         * Returns the data of the current component plus the values of the children components
         * @return {object}
         */
        getData : function(childrenFilterList) {
            return this._getAllData(childrenFilterList);
        },

        _getAllData : function(childrenFilterList) {
            var self = this,
                localData = this.getLocalData(),
                localDataType = typeof localData,
                modelType = typeof this.model,
                isLocalDataObj = localDataType == 'object' || localDataType == 'undefined',
                mergedData;

            // Children data to export
            if (this.components) {
                var childrenData = {};
                $.each(this.components, function(key, component) {
                    var compInst = component.inst,
                        data;
                    if (!childrenFilterList || (childrenFilterList.indexOf(compInst) > -1)) {
                        data = self._getComponentData(key, compInst);
                        $.extend(childrenData, data);
                    }
                });
                if (!$.isEmptyObject(childrenData)) {
                    // We have data to merge from the children. In this case, both localData and model must be valid objects in order to merge
                    if (isLocalDataObj) {
                        localData = $.extend(childrenData, localData);
                    } else {
                        Logger.error('_getAllData: localData and childrenData dont have the same type', localData, childrenData);
                    }
                }
            }

            if (isLocalDataObj) {
                if (modelType == 'object' || modelType == 'undefined') {
                    mergedData = $.extend(this.model, localData);
                } else {
                    // Error, types mitmatch
                    Logger.error('_getAllData: localData and model data dont have the same type', localData, this.model);
                    mergedData = localData;
                }
            } else {
                // Merged data is the overwritten value
                mergedData = localData;
            }

            // At this point, mergedData can be a single primitive data or an object
            return mergedData;
        },

        /**
         * Gets the information for a single component
         * @param  {String} key       the key of the component in the data structure
         * @param  {Object} component the instance of the component
         * @return {Object}           JSON with the information
         */
        _getComponentData : function(key, compInst) {
            var data = {},
                instanceData = compInst.getData();

            if (instanceData !== undefined) {
                data[key] = instanceData;
            }

            // If there is any data to be merged at the parent level
            // then request it. For example
            if (compInst.getDataForParent) {
                var extraDataForParent = compInst.getDataForParent();
                $.extend(data, extraDataForParent);
            }

            return data;
        },

        /**
         * Returns the data from isolated components that have been
         * bound manually in this component
         *
         *  Must be implemented in child classes
         *
         */
        getLocalData : function() { },
        /**
         * Gets the errors after a getValue operation that represents
         * any validation error or I/O operation error
         * @return {object}
         */
        getErrors : function() {

        },
        /**
         * Sets the data of the current component plus the values of the children components
         *
         */
        setData : function(data /* , extraDataFromParent */) {
            var self = this,
                setSuccessfull = false;
            if ($.isPlainObject(data)) {
                if (this.components) {
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

                            setSuccessfull = compInst.setData(value, extraData) || setSuccessfull;

                            // Unassing the data from the original object
                            // When the getData is called, then value for that key will be
                            // fetched from the child component
                            data[key] = null;
                            delete data[key];
                        }
                    });
                }
            }
            // Assign the data to the current model
            self.model = data;

            return setSuccessfull;
        },
        /**
         * Compose a standard result object
         * @return {object} standard result object
         *                  - inst {Object} reference to current component
         */
        composeResultObject : function(args, defaultResultObject) {
            return $.extend.apply($, [true, {}, defaultResultObject].concat([].slice.call(args)).concat({ inst : this }));
        },
        /**
         * Standard object returned by a setData method
         * @abstract
         * - inst    {Object}  reference to current component
         * - success {boolean} set data failed or succeded
         */
        setDataResult : function() {
            return this.composeResultObject(arguments, { success : false });
        },
        /**
         * Called when the setData method is called
         * Receives the parent data object and extracts
         * the extra values that are needed for the component
         *
         * @param  Object parentData
         * @return mixed
         */
        extractParentData : null,
        /**
         * Called when the getData method is called.
         * If this method is implemented in the children class then
         * the returned object will be merged with the parent data set
         *
         * @return Object
         */
        getDataForParent : null,
        /**
         * Executes a specific function for each children component of the current component
         * @param  {string} method name of the method to execute
         */
        eachChildrenComponents : function(method) {
            var self = this,
                returnData = {};

            if (self.components) {
                var args = Array.prototype.slice.call(arguments, 1);
                // Register children maps
                $.each(self.components, function(key, childComp) {
                    // Iterate over all the components asking for the resources
                    var compInst = childComp.inst;
                    if (compInst[method]) {
                        returnData[key] = compInst[method].apply(compInst, args);
                    }
                });
            }
            return returnData;
        },
        /**
         * Executes a specific function for each children component of the current component
         * and all it's children
         *
         * @param  {string} method name of the method to execute
         */
        /**
         * Executes a specific function for each children component of the current component
         * and all it's children
         *
         * @param  {[type]} opts   {
         *                             callLocally : function() ...
         *                             callOnChildren : function() ...,
         *                             flatten : true
         *                         }
         * @param  {string} method name of the method to execute
         * @return {[type]}        [description]
         *
         * Run method by default locally and all children or use bellow functions
         * callLocaly : determine if method should be run locally
         * callOnChildren : determine if method should be run on childrens
         */
        callRecursively : function(optsParam, methodParam /* , args */) {
            var self = this,
                args = Array.prototype.slice.call(arguments, 0),
                method = methodParam,
                opts = optsParam;

            // Reverse optsParam and methodParam values
            if (typeof optsParam === 'string') {
                // opts is the method so we store it first in that variable
                method = optsParam;
                var defaultOpts = {};
                // The first parameter is the method that we want to call
                args.unshift(defaultOpts);
                // Assign new value to local variable
                opts = defaultOpts;
            }

            var results = opts.flatten ? [] : {};

            // We will resolve from bottom to top because the local method
            // might be dependant on that method being resolved first in the children
            // (i.e.) cascadeStateChange before a call to getData method locally

            // Run this method on the children only if the option is undefined
            // or the funtion returns true
            if (!opts.callOnChildren || opts.callOnChildren(self)) {
                if (opts.flatten) {
                    results = $.merge(results, self.callChildrenRecursively(opts, args));
                } else {
                    results = $.extend(true, {}, results, self.callChildrenRecursively(opts, args));
                }
            }

            // Run this method locally only if the option is undefined
            // or returns true
            if (!opts.callLocally || opts.callLocally(self)) {
                // Calls the function in the current object
                var fn = this[method];
                if (fn) {
                    var params = args.slice(2),
                        localResult = fn.apply(this, params);

                    if (opts.flatten) {
                        results = results.concat(localResult);
                    } else {
                        results.data = localResult;
                    }
                }
            }

            return results;
        },
        /**
         * callRecursively helper
         * Implements children recursion over components
         * @abstract
         */
        callChildrenRecursively : function(opts, args) {
            var results = opts.flatten ? [] : {};

            if (this.components) {
                var components = {};
                // Register children maps
                $.each(this.components, function(key, childComp) {
                    // Iterate over all the components asking for the resources
                    var compInst = childComp.inst,
                        childrenResult = compInst.callRecursively.apply(compInst, args);

                    if (opts.flatten) {
                        results = results.concat(childrenResult);
                    } else {
                        components[key] = childrenResult;
                    }
                });

                if (!opts.flatten) {
                    results.components = components;
                }
            }

            return results;
        },

        /**
         * Sets the parent component if any of this component
         */
        setParentComponent : function(parentComponent) {
            this.parentComponent = parentComponent;
        },
        /**
         * Gets the parent component of the current one
         */
        getParentComponent : function() {
            return this.parentComponent;
        },
        /**
         * Gets the children components container
         */
        getComponents : function() {
            return this.components;
        },
        /**
         * Search for child key in provided context using child component instance as filter
         * @param  {object} childCompInst     child component instance
         * @param  {array}  componentsContext components pool (default: this.component)
         * @return {[type]}                   child key in components context
         */
        getChildKey : function(childCompInst, componentsContext) {
            var childKey = null;
            componentsContext = componentsContext ? componentsContext : this.components;

            for (var k in componentsContext) {
                if (componentsContext.hasOwnProperty(k) && componentsContext[k] === childCompInst) {
                    childKey = k;
                    break;
                }
            }

            return childKey;
        },
        /**
         * Check if key is defined as a child component
         * @param  {Object} childKey key for retrieval
         */
        childExists : function(childKey, componentsContext) {
            componentsContext = componentsContext ? componentsContext : this.components;
            return !!componentsContext[childKey] && componentsContext.hasOwnProperty(childKey);
        },
        /**
         * Get child component by key
         * @param  {Object} childKey key for retrieval
         */
        c : function(childKey, componentsContext) {
            componentsContext = componentsContext ? componentsContext : this.components;
            return this.childExists(childKey, componentsContext) ? componentsContext[childKey].inst : null;
        },
        /**
         * Utility function used to determine if the current component
         * if a descendant of the specified root component
         */
        isDescendantOf : function(rootComponent) {
            var directChlld = BaseComponent.searchComponentInDescendants(rootComponent, this);
            return (directChlld != null);
        },
        /**
         * Merges the attributes of the $view top node with the content top node
         * And then merges the children as well
         */
        _mergeViewWithContent : function($domSpace, content) {
            var $content = $(content),
                currentViewClass = $domSpace.attr('class') || '',
                contentClass = $content.attr('class') || '';

            // Convert the classes to array
            currentViewClass = currentViewClass.split(' ');
            contentClass = contentClass.split(' ');

            // Merge both arrays
            contentClass = contentClass.concat(currentViewClass);

            // Remove duplicate class
            contentClass = Util.arrayUnique(contentClass);

            $domSpace.attr('class', contentClass.join(' '));
            // We need to merge the top element attributes like classes first and then append the contents
            $domSpace.append($content.contents());
        },

        /**
         * MOVE THE METHODS BELOW THIS TO A SEPARATE CLASSS?
         */

        /**
         * Gets the title L10n key and adds it to the list of translations
         * that will be requested. MUST BE CALLED IN THE INIT METHOD
         */
        appendL10n : function(key) {
            if (key && key != null) {
                // Make sure the l10n key exists with an array
                this.resourcesDef = $.extend(true, {}, this.resourcesDef, {l10n : []});

                // push the new key to be retrieved
                this.resourcesDef.l10n.push(key);
            }
        },

        /**
         * Sets the notification center instance that will
         * use to handle the event in the components tree
         */
        setBackbone : function(backbone) {
            this.backbone = backbone;
        },
        /**
         * Sets the value of an option in the current instance
         * @param {string} option name of the option to be set
         * @param {[type]} value value to be assigned
         * @param {boolean} recursive  true if should set the option to its children
         */
        setOption : function(option, value, recursive) {
            this.opts[option] = value;
            if (recursive) {
                this.eachChildrenComponents('setOption', option, value, recursive);
            }

            // Tries to call a custom set method for this particular option (if exists)
            this.callCustomSetMethod(option, value);
        },

        callCustomSetMethod : function(option, value) {
            var methodName = '_set' + Util.capitalizeFirstLetter(option),
                method = this[methodName];
            if (method) {
                log('BaseComponent: found custom set method', methodName, value);
                method.call(this, value);
            }
        },
        /**
         * Fires the given event for the current component as well as the
         * notification center.
         * @param  {string} name event name
         */
        fireEventAndNotify : function(name) {
            var args = Array.prototype.slice.call(arguments, 1);
            // We re-insert the event name + the current instance to the arguments
            args.unshift(name, this);

            this.fireEvent.apply(this, args);
            if (this.backbone) {
                this.backbone.fireEvent.apply(this.backbone, args);
            }
        },
        /**
         * Sets the visibility of the spinner.
         * This method will count how many times it has been set to true, and how many to false.
         * Only when the counter reaches 0 we will hide the spinner. You can force the spinner to hide using the extra parameter force
         *
         * @param  {Boolean} isVisible sets the visibility of the spinner
         * @param  {[type]}  force     if set to true and the isVisible param is false, then it will hide the spinner
         *                             regardless of the visiblityCount
         */
        toggleSpinnerVisibility : function(isVisible, force) {
            var self = this,
                spinner = this.opts.spinner;

            if (!spinner) {
                // No spinner defined
                return;
            }

            // Reset the visibility count initial value if undefined
            self.visibilityCount = self.visibilityCount || 0;

            if (isVisible) {

                // Increases the count of visibility
                self.visibilityCount++;

                // Reset flag
                self.abortSpinnerLoading = false;

                if (self.visibilityCount > 1) {
                    // The spinner is already visible
                    // so we do nothing
                    return;
                }

                // We need to create the spinner
                var spinnerPromise = SingleInstanceFactory
                                        .getInst()
                                        .getComponent(spinner, DEFAULT_SPINNER_PATH);

                spinnerPromise.then(function(spinnerInstance) {
                    // If we find that the spinner has been hidden
                    // before it was ready to show, then we abord the instance creation and loading
                    if (self.abortSpinnerLoading) {
                        return;
                    }

                    // Removes the spinner from the view
                    if (self.spinnerComp) {
                        self.spinnerComp.destroy();
                    }

                    self.spinnerComp = spinnerInstance;
                    //Create a local insertion point
                    var $spinnerInsertPoint = $('<div class="spinner"></div>');
                    // Prepends the spinner
                    self.$insertionPoint.prepend($spinnerInsertPoint);
                    // Load the spinner
                    self.spinnerComp.load($spinnerInsertPoint);
                });
            } else {

                // Decreases the count of visibility
                self.visibilityCount--;

                if (self.visibilityCount >= 1 && !force) {
                    // If the visibility count has not reached zero and the visibility is not forced
                    // then do nothing
                    return;
                }

                // Reset to zero
                self.visibilityCount = 0;

                // Flag in case the spinner has not been loaded yet
                self.abortSpinnerLoading = true;

                // When the spinner reaches zero then we hide it
                // Removes the spinner from the view
                if (self.spinnerComp) {
                    self.spinnerComp.destroy();
                }
            }
        },
        /**
         * Displays the error handler  (specified in this.opts.errorHandler).
         *
         * @param  {Boolean} isVisible sets the visibility of the errorHandler
         * @param  {Object}  errorInfo contextual information about the error. This can be used to display more information
         *                             by the error handler
         */
        toggleErrorVisibility : function(isVisible, errorInfo) {

            var self = this,
                errorHandler = this.opts.errorHandler || BaseComponent.getDefaultErrorHandler();

            if (isVisible) {

                // We need to create the errorHandler
                var component = SingleInstanceFactory
                                        .getInst()
                                        .getComponent(errorHandler);

                component.then(function(errorHandlerInstance) {

                    // Removes the errorHandler from the view
                    if (self.errorComp) {
                        self.errorComp.destroy();
                    }

                    self.errorComp = errorHandlerInstance;
                    //Create a local insertion point
                    var $compInsertionPoint = $('<div class="error-handler"></div>');
                    // Prepends the errorHandler
                    self.$insertionPoint.prepend($compInsertionPoint);
                    // Load the errorHandler
                    self.errorComp.load($compInsertionPoint, errorInfo);
                });
            } else {

                // When the errorHandler reaches zero then we hide it
                // Removes the errorHandler from the view
                if (self.errorComp) {
                    self.errorComp.destroy();
                }
            }
        },
        /**
         * Destroys this component information, including children
         * DOM elements and bindings
         */
        destroy : function(removeViewFromDOM, isRootDelete) {

            var localRemoveView, childrenRemoveView;
            isRootDelete = (typeof isRootDelete === 'boolean') ? isRootDelete : true;

            // Assign default value to var
            if (removeViewFromDOM === undefined) {
                localRemoveView = true;
                childrenRemoveView = false;
            } else {
                localRemoveView = (childrenRemoveView = removeViewFromDOM);
            }

            // First called all children destroy
            this.eachChildrenComponents('destroy', childrenRemoveView, false);

            // Then remove from dom only if
            if (localRemoveView && isRootDelete) {
                // Removes all the handlers and the view itself from the DOM
                if (this.$view) {
                    // We need to check if the $view is already set in case that
                    // the destroy method has been called before the setup one
                    // (i.e.) the user is changing tabs too quickly

                    // @warn: if merged with insertion point on appendToView, the whole insertion point is removed
                    this.$view.remove();
                }
            }
        },

        /**
         * Completely destroy child component
         * @param  {Object}  keyOrChild          key or the child to remove
         * @param  {Boolean} removeChildFromDOM  control child remove from dom
         * @return {Boolean} destroy success
         */
        destroyChild : function(childKey, removeChildFromDOM, componentsContext) {
            componentsContext = componentsContext ? componentsContext : this.components;

            var destroyed = false,
                childComp = this.c(childKey, componentsContext);

            if (childComp) {
                childComp.destroy(removeChildFromDOM, true);
                delete componentsContext[childKey];
                destroyed = true;
            }

            return destroyed;
        },

        /**
         * Completely destroy child component and view
         * @abstract overwrite for custom template removals
         * @param  {Object}  childKey  key of the child to remove
         * @return {Boolean} destroy success
         */
        removeChild : function(childKey /* , dettachBeforeDestroy */) {
            // dettach to avoid backbone triggers on destroy
            var dettachedChild = this.detachChild(childKey),
                componentsContext = dettachedChild ? this.detachedComponents : this.components;
            // dettached elements reference is kept in this.detachedComponents
            // this.components references was previously moved
            return this.destroyChild(childKey, true, componentsContext);
        },

        /**
         * Removes reference to a children from this.components
         * todo : add storeDetached flag to control this.detachedComponents cache
         * @param  {Object} childKey key of the child to remove
         * @return {Object}          detached component or null if not a member of this.detachedComponents
         */
        detachChild : function(childKey /* , storeDetached */) {
            var dettachedChild = null,
                moveSuccessful = ComponentUtil.moveProperty(childKey, this.components, this.detachedComponents);
            // moves member `childKey` from `this.components` to `this.detachedComponents`
            if (moveSuccessful) {
                var child = this.detachedComponents[childKey],
                    dettachedChild = (child && child.inst) ? child.inst : null;
                if (dettachedChild) {
                    dettachedChild.callRecursively('setBackbone', null);
                }
            }
            return dettachedChild;
        },

        /**
         * Restores previously detached children to be a member of this.components again
         * @warning this method DOES NOT reattach backbone listeners (todo)
         * @param  {Object} childKey key of the child to add
         * @return {Object}          attached component or null if not a member of this.components
         */
        reattachChild : function(childKey) {
            // moves member `childKey` from `this.detachedComponents` to `this.components`
            ComponentUtil.moveProperty(childKey, this.detachedComponents, this.components);

            var child = this.c(childKey);
            if (child && child.inst) {
                child.inst.callRecursively('setBackbone', this.backbone);
            }

            return this.c(childKey);
        }
    });

    BaseComponent.classMembers({
        EV : {
            READY : 'ready',
            DOM_READY : 'dom_ready'
        },
        /**
         * Defines the default error handler for all the components, if no other is provided
         * @type String
         */
        defaultErrorHandler : DEFAULT_ERROR_HANDLER_PATH,

        /**
         * Given a root component and a target component, it returns
         * the direct children that contains <targetComponent> as
         * a descendent (if any). This method is usefull to determine if a target component
         * is children of root component.
         *
         */
        searchComponentInDescendants : function(rootComponent, targetComponent) {
            var currentComp = targetComponent,
                childComp;

            while (currentComp && !childComp) {
                var parent = currentComp.getParentComponent();
                if (parent === rootComponent) {
                    childComp = currentComp;
                } else {
                    currentComp = parent;
                }
            }
            return childComp;
        },
        /**
         * Sets a new default error handler for all the components, that will
         * be used if an error occurs
         * This will be path to a component that will handle
         */
        setDefaultErrorHandler : function(defaultErrorHandler) {
            this.defaultErrorHandler = defaultErrorHandler;
        },
        /**
         * Gets the default error handler defined all the components
         */
        getDefaultErrorHandler : function() {
            return this.defaultErrorHandler;
        }
    });

    // Exporting module
    return BaseComponent;

});
