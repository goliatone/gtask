/*global define:true requirejs:true*/
/* jshint strict: false */
requirejs.config({
    paths: {
        'jquery': 'jquery/jquery',
        'extend': 'gextend/extend',
        'gtask': 'gtask'
    }
});

define(function (require) {
    console.log('Loading');
    var Gtask = require('gtask'),
        $ = require('jquery');

    Gtask.prototype.emit = function(type){
        // console.log(type)
    };

	var gtask = Gtask({
        id:'get-user:',
        label: 'Getting user data...',
        task: function (done) {
            console.log(this.id, this.label);
            setTimeout(function(){
                console.log(this.id, ' data got')
                done();
            }.bind(this), 2000);
        }
    });

    Queue.enqueue(gtask);

    Queue.enqueue(Gtask({
        id:'get-device:',
        label:'Getting device ID',
        task: function () {
            console.log(this.label);
        }
    }));

    Queue.enqueue(Gtask({
        id:'connect-server:',
        label:'Getting connect to server...',
        task: function () {
            console.log(this.label);
        }
    }));


});


function Queue(){}

Queue.items = [];
Queue.enqueue = function(task) {
    var id = Queue.items.push(task);
    setTimeout(function() {
        Queue.execute(id);
    }, 0);
};

Queue.execute = function execute(id) {
    if (Queue.items.length < 1 || this.id) return

    var task = Queue.items.shift();

    if (!task) return console.log('process no process');

    this.id = id;

    task.onSuccess = function() {
        this.id = null;
        if(Queue.items.length) this.execute();
        else console.log('DONE')
    }.bind(this);

    task.execute();
};