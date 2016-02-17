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
 * Base Component factory
 */
define([
            'require',
            'jquery',
            'ju-shared/class'
        ],
        function(
            require,
            $,
            Class
        ) {
    'use strict';

    /**
     * Basic building block for components.
     * Each component will have a dictionary of children components
     */
    var ComponentFactoryBase = Class.extend({
            init : function() {

            },
            /**
             * Creates new instances of the defined map
             * @return map A map with instances of each component
             */
            createInstances : function(componentsDefinition, parentComponent, loadArgs, childrenExtendedOpts) {

                var self = this,
                    compDef = componentsDefinition,
                    parentComp = parentComponent,
                    promise = new Promise(function(resolve, reject) {

                        if (!compDef) {
                            Logger.error('ComponentFactoryBase: definition is empty...', compDef);
                            reject();
                            return;
                        }

                        var instanceMap = {},
                            // Create a copy of the compponents definition
                            compDefinition = $.extend(true, {}, compDef),
                            // Creates a map of the components definition
                            modulesPaths = $.map(compDefinition, function(def) {
                                return def.component;
                            });

                        // @niceToHave At this point if the childrenExtendedOpts contains paths to
                        // config files as the opts value, then we would need to add them to the modulesPaths
                        // so it fetches the config files along with the components themselves

                        log('ComponentFactoryBase: Fetching the following modules files', modulesPaths);
                        // Load all the modules
                        require(modulesPaths, function() {
                            // call the fetched children method of the children

                            var componentsClasses = arguments,
                                childrenReadyPromises = [],
                                index = 0;

                            $.each(compDefinition, function(key, def) {
                                var ComponentClass = componentsClasses[index],
                                    opts = def.opts,
                                    childExtendedOpts;

                                // Process opts and children extended opts
                                // that will be merged and injected to the
                                // current child instance
                                var newOptsSet = self.processExtendedOpts(key, def, opts, childrenExtendedOpts);
                                opts = newOptsSet.opts;
                                childExtendedOpts = newOptsSet.childExtendedOpts;

                                // Creates an instance of the Component class
                                var componentInst = new ComponentClass(opts);

                                if (parentComp) {
                                    componentInst.setParentComponent(parentComp);
                                }

                                def.inst = componentInst;
                                // Add to result map
                                instanceMap[key] = def;

                                // Trigger children fetch
                                var promise = componentInst.fetchChildrenComponents(componentInst, loadArgs, childExtendedOpts);
                                childrenReadyPromises.push(promise);
                                index++;
                            });

                            log('ComponentFactoryBase: Waiting for all the children to load...', instanceMap);

                            // Waits until all the children are ready with their children
                            var childrenReadyPromise = Promise.all(childrenReadyPromises);

                            childrenReadyPromise
                                .then(function() {
                                    // susbcribeToAllComponents for the Children fetched event
                                    log('ComponentFactoryBase: Dependencies loaded...');

                                    // Returns the array of components in the same order they were defined
                                    resolve(instanceMap);
                                })
                                ['catch'](reject);
                        });
                });
                return promise;
            },
            /**
             * This fuction will return the new opts and the extended options the
             * child compponent that will be instanciated.
             *
             */
            processExtendedOpts : function(key, childDefinition, opts, childrenExtendedOpts) {
                var childExtendedOpts;
                // Mix the options for the current component
                // Extension opts contains the options for the descendants
                if (childrenExtendedOpts) {
                    var extendedOpts = childrenExtendedOpts[key];
                    if (extendedOpts) {
                        if (extendedOpts.opts) {
                            // At this stage, opts could be either:
                            //   - An object loaded directly or by declaring a string
                            //     in the createInstances method
                            //   - A function, in which case we need to call it
                            //     to get the value of opts
                            if ($.isFunction(extendedOpts.opts)) {
                                // If its a function we will call it, and pass in
                                // the childDefinition in case it needs more context to return
                                // the extended opts
                                var extOpts = extendedOpts.opts(childDefinition);
                                opts = $.extend(true, opts, extOpts);
                            } else {
                                opts = $.extend(true, opts, extendedOpts.opts);
                            }
                        }
                        // Delegate the extended opts to the child
                    }
                    // Extended opts comming from a grandparent has has precedence over the locally
                    // defined extendedOpts (if any)
                    childExtendedOpts = $.extend(childDefinition.extendedOpts, extendedOpts);
                } else {
                    // If the childrenExtendedOpts do not exists yet, then
                    // we grab them from the childDefition and pass them the the
                    // child directly
                    //
                    // In the future, the value of childDefinition.extendedOpts
                    // could be a string in which case we would need to parse the string
                    // to get a explicit object
                    childExtendedOpts = childDefinition.extendedOpts;
                }
                // Returns composed object
                return {
                    opts : opts,
                    childExtendedOpts : childExtendedOpts
                };
            }
        });

    // Exporting module
    return ComponentFactoryBase;

});
