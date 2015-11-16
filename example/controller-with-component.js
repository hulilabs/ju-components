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
 * Example controller that loads a component
 *
 * NOTICE : you need to add this configuration to a `router` file so the example can work:

                'example' : {
                    route : 'example/component',
                    controller : 'example/controller-with-component'
                }

            then open in your browser: http[s]://[your-app]/#example/component
 *
 *
 * WARNING : proof of concept only, not a "good practices" guideline
 *           however, explanatory comments are reliable :p
 */
define([
            'ju-components/landing-module',
            'example/basic-component-1'
        ],
        function (
            ComponentLandingModule,
            ExampleComponent
        ) {

    'use strict';

    /**
     * Handles routing to display a component
     *
     * The only requirement is to set the member `this.landCompClass`
     * with a component definition (i.e. a class that extends component/base)
     */
    var ControllerWithComponent = ComponentLandingModule.extend({

        init : function() {
            this._super.apply(this);
            this.landCompClass = ExampleComponent;
        }
    });

    return ControllerWithComponent;

});
