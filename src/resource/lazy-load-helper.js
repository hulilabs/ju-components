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
            'ju-shared/class',
            'ju-shared/l10n',
            'ju-shared/app-config-manager',
            'ju-components/resource/resource-collector',
            'ju-components/resource/resource-manager',
            'ju-components/resource/storage/template-storage',
            'ju-components/resource/storage/options-data-storage',
            'ju-components/resource/storage/context-storage',
            'ju-components/base',
            // unmmaped imports
            'ju-shared/logger'
        ],
        function(
            Class,
            L10n,
            AppConfig,
            ResourceCollector,
            ResourceManager,
            TemplateStorage,
            OptionsDataStorage,
            ContextStorage,
            BaseComponent
        ) {
    'use strict';

    /**
     * Helper for lazy loading resources outside the context of an object
     * based in Component class.
     *
     * It uses the same resources definition and provides helper methods for
     * getting any of the available resources
     *
     * Note that there's no `getCss` helper, since CSS is automatically added to
     * the page once it's loaded
     */
    // will only use classMembers for now
    var LazyLoadHelper = Class.extend({});

    LazyLoadHelper.classMembers({
        /**
         * Lazy loads requested resources, returns a promise resolved when done.
         *
         * Once the promise is fulfilled, you can use the helpers below to access the resources
         *
         * @param  {Object} resourceMap
         *                  {
         *                       cssFile : [],
         *                       l10n : [],
         *                       template : [],
         *                       optionsData : [],
         *                       appConfig : [],
         *                       context : {}
         *                  }
         * @param  {Component} component
         * @return {Promise}
         */
        fetch : function(resourceMap, component) {

            if (resourceMap.hasOwnProperty('context') &&
                !(component instanceof BaseComponent)) {
                Logger.error('LazyLoadHelper: unable to load content without providing a component instance');
                return;
            }

            var collector = ResourceCollector.createInst();
            collector.addResources(resourceMap, component);

            return ResourceManager.getInst().loadResources(collector);
        },

        getTemplate : function(templatePath) {
            return TemplateStorage.getInst().get(templatePath);
        },

        getL10n : function(l10nKey) {
            return L10n.t(l10nKey);
        },

        t : function(l10nKey) {
            return L10n.t(l10nKey);
        },

        getOptionsData : function(optionsDataKey) {
            return OptionsDataStorage.getInst().get(optionsDataKey);
        },

        getContext : function(handlerName, component) {
            return ContextStorage.getInst().get(handlerName, component);
        },

        getAppConfig : function(appConfigKey) {
            return AppConfig.get(appConfigKey);
        }
    });

    // Exports
    return LazyLoadHelper;

});
