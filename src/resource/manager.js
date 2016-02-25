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
 * Stores view templates in the client side
 *
 * @todo Use a local map to control what resources were already requested but have not been loaded into the collections
 * @todo provide the method to access the resources from the template
 */
define([
            'jquery',
            'ju-shared/class',
            'ju-components/resource/strategy/serverless',
            // Storage classes
            'ju-shared/l10n',
            'ju-shared/app-config-manager',
            'ju-shared/client-vars-manager',
            'ju-shared/util',
            'ju-components/resource/storage/template-storage',
            'ju-components/resource/storage/options-data-storage',
            'ju-components/resource/storage/context-storage',
            'ju-components/util'
        ],
        function(
            $,
            Class,
            ServerLessResourceFetcher,
            // Storage classes
            L10n,
            AppConfig,
            ClientVarsManager,
            SharedUtil,
            TemplateStorage,
            OptionsDataStorage,
            ContextStorage
        ) {
    'use strict';

    /**
     *
     */
    var ResourceManager = Class.extend({
        /**
         * Constructor
         */
        init : function() {

            this.storageMapping = {
                l10n : L10n,
                appConfig : AppConfig,
                template : TemplateStorage.getInst(),
                optionsData : OptionsDataStorage.getInst(),
                context : ContextStorage.getInst(),
                cssFile : (new ClientVarsManager())
            };
        },
        isLoaded : function(storage, key) {

            // Validate that the key is not already loading
            // TODO

            // Validate that the file does not exists in the corresponding storage
            return this.storageMapping[storage].exists(key);
        },
        /**
         * Fetch
         * @param  {[type]} resourceCollector [description]
         * @return {[type]}                   [description]
         */
        loadResources : function(resourceCollector) {
            var self = this,
                resourceCollectorMap = resourceCollector.resourceMap;

            // Request the rest of the resources to the server using the Resources Proxy
            var resourceMap = {
                // Static related resources
                l10n : resourceCollectorMap.l10n,
                cssFile : resourceCollectorMap.cssFile,
                templates : resourceCollectorMap.template,

                // Data related resources
                app_config : resourceCollectorMap.appConfig,
                options_data : resourceCollectorMap.optionsData,
                context : resourceCollectorMap.context
            };

            var resourcePromise;

            // Remove empty map values so we don't make an unnecessary request to the server
            SharedUtil.sanitizeJson(resourceMap);

            if ($.isEmptyObject(resourceMap)) {
                log('ResourceManager: no resources to fetch');
                // Resolve a promise inmediatelly because the are no resources to fetch
                resourcePromise = Promise.resolve(null);

            } else {

                var resourceFetchStrategy = ResourceManager.getStrategy();
                // Creates a new instance of the strategy
                resourcePromise = resourceFetchStrategy.fetchResources(resourceMap);

                resourcePromise.then(function(data) {

                    if (!$.isPlainObject(data)) {
                        Logger.error('ResourceManager: response object does not comply with the expected format');
                        return;
                    }

                    var storeMapping = self.storageMapping;

                    storeMapping.l10n.append(data.l10n);
                    storeMapping.appConfig.append(data.app_config);
                    storeMapping.template.append(data.templates);
                    storeMapping.optionsData.append(data.options_data);
                    storeMapping.context.append(data.context);
                    storeMapping.cssFile.append(data.cssFile);
                });
            }
            return resourcePromise;
        },
        /**
         * Gets the options data object from the storage given the key
         * @param  {string} key to retrieve the data
         * @return {object}     [description]
         */
        getOptionsData : function(key) {
            return OptionsDataStorage.getInst().get(key);
        }
    });

    /**
     * Class members
     */
    ResourceManager.classMembers({
        /**
         * Gets the current resource loader strategy
         * @return {[type]} [description]
         */
        getStrategy : function() {
            if (!this.strategy) {
                // Creates a default serverless strategy
                this.strategy = new ServerLessResourceFetcher();
            }
            return this.strategy;
        },
        /**
         * Sets the strategy to fetch the resources
         */
        setStrategy : function(strategy) {
            this.strategy = strategy;
        }

    });

    // Exports
    return ResourceManager;

});
