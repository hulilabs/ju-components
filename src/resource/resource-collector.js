
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
 * Resource Collector
 */
define([
            'ju-shared/class',
            'ju-components/resource/resource-manager'
        ],
        function(
            Class,
            ResourceManager
        ) {
    'use strict';

    /**
     * Represents patient Contact component
     */
    var ResourceCollector = Class.extend({
        init : function() {

            // Stores a local resource map
            this.resourceMap = {
                cssFile : [],
                l10n : [],
                appConfig : [],
                template : [],
                optionsData : [],
                context : {}
            };
        },
        /**
         * Add a resource map to the current collector
         */
        addResources : function(resourceMap, component) {
            if (!resourceMap) {
                // Nothing to add
                return;
            }

            // Add CSS files
            this.addKeys(
                resourceMap.cssFile,
                this.resourceMap.cssFile,
                'cssFile'
            );

            // Add L10n keys
            this.addKeys(
                resourceMap.l10n,
                this.resourceMap.l10n,
                'l10n'
            );

            // // Add application config keys
            this.addKeys(
                resourceMap.appConfig,
                this.resourceMap.appConfig,
                'appConfig'
            );

            // // Add templates keys
            this.addKeys(
                resourceMap.template,
                this.resourceMap.template,
                'template'
            );

            // // Add options data
            this.addKeys(
                resourceMap.optionsData,
                this.resourceMap.optionsData,
                'optionsData'
            );

            // Add context request data
            this.addContextRequest(
                resourceMap.context,
                component
            );
        },
        /**
         * Add CSS files to the collector
         */
        addCssFiles : function(filePaths) {
            if (!filePaths) {
                // Nothing to add
                return;
            }
            for (var idx = 0, length = filePaths.length; idx < length; idx++) {
                var filePath = filePaths[idx];

                if (filePath && this.resourceMap.cssFile.indexOf(filePath) === -1) {
                    this.resourceMap.cssFile.push(filePath);
                }
            }
        },
        /**
         * Adds context request information
         *
         * contextRequest format from component XYZ:
         *
         * {
         *     handler: {
         *         v : 2
         *         s : 3
         *     },
         *     handlerAlt : {
         *         r : 4,
         *         w : 8
         *     }
         * }
         *
         *
         * this.resourceMap format:
         *
         * {
         *     handler : {
         *         ABC : {
         *             u:3
         *         }
         *     }
         * }
         *
         * Result after merge :
         *
         * {
         *     handler: {
         *         ABC : {
         *             u:3
         *         },
         *         XYZ : {
         *             v : 2
         *             s : 3
         *         }
         *     },
         *     handlerAlt : {
         *         XYZ : {
         *             r : 4,
         *             w : 8
         *         }
         *     }
         * }
         */
        addContextRequest : function(contextRequest, component) {

            if (!contextRequest) {
                // Nothing to add
                return;
            }

            var self = this,
                componentId = component.id;

            if (!componentId) {
                Logger.error('Resource Collector: cannot add context request without component id');
                return;
            }

            $.each(contextRequest, function(key, value) {
                var componentContext = {};
                componentContext[componentId] = value;

                // Final destination of the context object
                self.resourceMap.context[key] = $.extend(
                    true,
                    self.resourceMap.context[key],
                    componentContext);
            });

        },
        addKeys : function(keys, collection, storage) {
            if (!keys) {
                // Nothing to add
                return;
            }
            var resourceManager = ResourceManager.getInst();

            for (var idx = 0, length = keys.length; idx < length; idx++) {
                var key = keys[idx];
                if (key &&
                    !resourceManager.isLoaded(storage, key) &&
                    (collection.indexOf(key) === -1)) {
                    collection.push(key);
                }
            }
        }
    });

    /**
     * Class members
     */
    ResourceCollector.classMembers({
        /**
         * Returns a new instance of the Resource Collector
         */
        createInst : function() {
            var resourceCollector = new ResourceCollector();
            return resourceCollector;
        }
    });

    // Resource Collector module
    return ResourceCollector;

});
