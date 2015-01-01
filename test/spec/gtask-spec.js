/*global define:true, describe:true , it:true , expect:true,
beforeEach:true, sinon:true, spyOn:true , expect:true */
/* jshint strict: false */
define(['gtask', 'jquery'], function(Gtask, $) {

    describe('just checking', function() {

        it('Gtask should be loaded', function() {
            expect(Gtask).toBeTruthy();
            var gtask = new Gtask();
            expect(gtask).toBeTruthy();
        });

        it('Gtask should initialize', function() {
            var gtask = new Gtask({autoinitialize:false});
            var output   = gtask.init();
            var expected = 'This is just a stub!';
            expect(output).toEqual(expected);
        });
    });
});