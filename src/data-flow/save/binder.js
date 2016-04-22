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
            'jquery',
            'ju-components/data-flow/save/handler',
            'common/component/save/save-changes',
            'ju-components/data-flow/events',
            'ju-shared/logger'
        ],
        function(
            $,
            SaveHandler,
            SaveChangesComponent,
            DataBehaviorEvents,
            Logger
        ) {

    'use strict';
    /**
     * constructor
     * @param {Component} opts.component to add save behavior
     * @param {Proxy}     opts.proxy that saves data
     * @param {String}    opts.strategy name to use
     * @param {ChangesTracker} opts.tracker
     * @param {Array}     opts.trackEvents
     *
     * @param {Function} onComponentSaveSuccess
     * @param {Function} onComponentSaveError
     */
    var SaveDataBinder = function SaveDataBinder(opts) {
        this.opts = opts;

        this._validateOptions(opts);

        this.saveHandler = new SaveHandler({
            saveProxyCallback : this.opts.saveProxyCallback,
            strategy : this.opts.strategy,
            tracker : this.opts.tracker,
            // called to make changes in data right before sending it
            prepareDataToSave : this.opts.prepareDataToSave,
            // additional events for changes tracker
            trackEvents : this.opts.trackEvents
        });
    };

    SaveDataBinder.prototype = {
        setup : function() {
            this.saveHandler.setup(this.opts.component);
            return this;
        },

        /**
         * Call this method if you want to trigger save lifecycle events (DataBehaviorEvents.EV.COMPONENT)
         * in the bound component
         */
        addSaveTriggersOnComponent : function() {
            var component = this.opts.component;

            // when a SUCCESS or ERROR event occurs in the save handler
            // it will bubble up as a DataBehaviorEvents.EV.COMPONENT.event-name event
            this.saveHandler.on(SaveHandler.EV.SAVE_HANDLER_SUCCESS,
                $.proxy(component.trigger, component, DataBehaviorEvents.EV.COMPONENT.SAVE_SUCCESS));
            this.saveHandler.on(SaveHandler.EV.SAVE_HANDLER_ERROR,
                $.proxy(component.trigger, component, DataBehaviorEvents.EV.COMPONENT.SAVE_ERROR));

            return this;
        },

        /**
         * Adds listeners for DataBehaviorEvents.EV.UI on a provided UI element that can be
         * either a SaveChanges component or something that triggers the above events
         * @param  {ObservableClass} opts.saveChangesComponent any class that triggers DataBehaviorEvents.EV.UI events
         *                                                     if it's a component, it'll be linked for change tracking
         * @param  {Backbone}        opts.backbone             bound component's backbone
         * @param  {Function}        opts.onDiscardChanges
         * @return {this}
         */
        linkSaveChangesComponent : function(opts) {

            var saveChangesComponent = opts.saveChangesComponent;
            // data link is only performed on components
            if (saveChangesComponent instanceof SaveChangesComponent && !$.isEmptyObject(opts)) {
                var saveChangesComponentLinkOpts = {
                    // @match something in SaveHandler.STRATEGY
                    saveStrategyName : this.opts.strategy,
                    // component with changes to track
                    backbone : opts.backbone
                };

                saveChangesComponent.linkToDataProvider(saveChangesComponentLinkOpts);
            }

            // waits for a ui save-data request to perform the save using the SaveHandler
            saveChangesComponent.on(DataBehaviorEvents.EV.UI.REQUEST_SAVE, $.proxy(this._onUiSaveRequest, this));

            // binds discard action, the default is reloading the page
            // it cna be overriden using `opts.discardHandler` param
            var discardHandler = opts.discardHandler || $.proxy(this._onSaveChangesComponentDiscard, this);
            saveChangesComponent.on(DataBehaviorEvents.EV.UI.DISCARD_SAVE_DATA, discardHandler);

            return this;
        },

        /**
         * When a component is initialized with data, propagates this change to the save handler
         * @param  {Object} dataModel subset that follows the same structure of the bound component trere
         */
        initializeSaveWithDataModel : function(dataModel) {
            this.saveHandler.initializeStrategyWithDataModel(dataModel);
        },

        _onSaveChangesComponentDiscard : function() {
            log('SaveBehavior : no action defined for "discard changes"');
        },

        /**
         * Handler for save request event triggered by UI helper
         * @param  {Function} successCallback       provided by UI helper
         * @param  {Function} exitOnSuccessCallback provided by UI helper
         * @param  {Function} errorCallback         provided by UI helper
         */
        _onUiSaveRequest : function(successCallback, exitOnSuccessCallback, errorCallback) {
            this.saveHandler.saveData(this.opts.component)
                .then(
                    $.proxy(this._performSaveSuccessActions, this, successCallback, exitOnSuccessCallback),
                    $.proxy(this._performSaveErrorActions, this, errorCallback)
                );
        },

        /**
         * On success, will call exit callback or [ui success callback and save success opt]
         * @param  {Function} uiSuccessCallback     provided by UI helper to handle success
         * @param  {Function} exitOnSuccessCallback most relevant callback to exit after save
         * @param  {Object} response                save result object
         */
        _performSaveSuccessActions : function(uiSuccessCallback, exitOnSuccessCallback, response) {
            // if an exit callback is provided, we'll call it and we won't call any other
            // success handler
            if ('function' === typeof exitOnSuccessCallback) {
                exitOnSuccessCallback();
            } else {
                if ('function' === typeof uiSuccessCallback) {
                    uiSuccessCallback();
                }

                this.opts.onComponentSaveSuccess(response);
            }
        },

        /**
         * On error, validation errors are passed to uiErrorCallback. They'll be handled by opts.onComponentSaveSuccess otherwise
         * @param  {Function} uiErrorCallback
         * @param  {Mixed}    errors
         */
        _performSaveErrorActions : function(uiErrorCallback, errors) {
            Logger.warn('SaveBehavior: unable to save data', arguments);
            // NOTICE:
            // testing if `errors` is an array is a hint to know if it is a set of validation errors
            if ('function' === typeof uiErrorCallback && $.isArray(errors)) {
                uiErrorCallback(errors);
            } else {
                this.opts.onComponentSaveError(errors);
            }
        },

        /**
         * Validates provided options to make sure a couple of required fields are provided
         * @param  {Object} opts
         */
        _validateOptions : function(opts) {
            if ('function' !== typeof opts.saveProxyCallback) {
                Logger.error('SaveBehavior : you must provide a valid saveProxyCallback');
            }

            if (opts.strategy && !opts.tracker) {
                Logger.error('SaveBehavior : you must provide a tracker opt if you\'re using a save strategy');
            }
        }

    };

    // Exports
    return SaveDataBinder;
});
