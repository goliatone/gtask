/*global define:true requirejs:true*/
/* jshint strict: false */
requirejs.config({
    paths: {
        'jquery': 'jquery/jquery',
        'extend': 'gextend/extend',
        'gtask': 'gtask'
    }
});

define(['gtask', 'jquery'], function (Gtask, $) {
    console.log('Loading');
	var gtask = new Gtask();
});