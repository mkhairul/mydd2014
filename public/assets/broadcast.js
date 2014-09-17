(function($,pubsub,janus){
    var service = window.service = window.service || {};
    service.broadcast = (function(){
        var broadcastConstructor = function Broadcast(options){
            if(false === (this instanceof Broadcast)){
                return new Broadcast();
            }
            var self = this;
            var defaultOptions = {
                introEl: '.intro',
                loadingEl: '.loading',
                mainContainerEl: '.main-container',
                startBroadcastEl: '#start_broadcast',
                gatewayServer: '',
                apiPath: '/api/',
            }
            this.options = options = $.extend(defaultOptions, options);
            this.getOptions = function(){ return options; }
            this.setOptions = function(param){ options = $.extend(options, param); }

            if(self.options.gatewayServer == ''){
                if(window.location.protocol === 'http:')
                    self.options.gatewayServer = 'http://' + window.location.hostname + ':8088/janus';
                else
                    self.options.gatewayServer = 'https://' + window.location.hostname + ':8088/janus';
            }
            janus.init({debug:true, callback:function(){}});

            // bind all events
            $(self.options.startBroadcastEl).on('click', function(){
                self.start();
            })
        }

        broadcastConstructor.prototype.mainpageInit = function(){
            var self = this;
            $(self.options.loadingEl).fadeOut('slow', function(){
                self.hideLoading();

                // no existing video, insert intro text
                $(self.options.introEl).removeClass('hide');
                $(self.options.introEl).show();
            })

            // Change name trigger (top right corner)
            $('#change_name').on('click', function(){
                $('#change_name_modal').modal();
            })

            // Save the name
            $('#change_name_modal .btn-primary').on('click', function(){
                var name = $('#change_name_modal [name=name]').val();
                $.post(self.options.apiPath + 'changeName', { "name":name }, function(data){
                    if(data.status === 'success')
                    {
                        $('.username').html(name);
                    }
                },'json')

                $('#change_name_modal').modal('hide');
            })
        }

        // Start broadcasting, by default its using Video MCU
        // start -> createSession -> attachPlugin -> registerUser -> publishFeed
        broadcastConstructor.prototype.start = function(){
            var self = this;
            self.loading();
            self.createSession();
        }

        broadcastConstructor.prototype.createSession = function(){
            var self = this;
            self.j_instance = new janus(
              {
                  server: self.options.gatewayServer,
                  success: function(){
                      self.updateLoading('Connected')
                      self.attachPlugin(self.j_instance);
                  },
                  error: function(cause){
                      console.log('error');
                  },
                  destroyed: function(){
                      console.log('destroyed');
                  }
              }
            );
        }

        broadcastConstructor.prototype.attachPlugin = function(instance){
            var self = this;
            instance.attach(
                {
                    plugin: 'janus.plugin.videoroom',
                    success: function(pluginHandle){
                        self.pluginHandle = pluginHandle;
                        console.log("Plugin attached! (" + self.pluginHandle.getPlugin() + ", id=" + self.pluginHandle.getId() + ")");
									      console.log("  -- This is a publisher/manager");
                        self.registerUser(self.pluginHandle);
                    },
                    error: function(cause){

                    },
                    consentDialog: function(on){},
                    onmessage: function(msg, jsep){
                        console.log(" ::: Got a message (publisher) :::");
                        var event = msg['videoroom'];
                        self.publishFeed(self.pluginHandle);
                    },
                    onlocalstream: function(stream){
                        console.log('Displaying stream?')
                        self.displayStream(stream);
                    },
                    onremotestream: function(stream){},
                    oncleanup: function(){}
                }
            );
        }

        broadcastConstructor.prototype.displayStream = function(stream){
            var self = this;
            var video = $('<video autoplay>').attr({
                id: self.room,
                style: "width: 100%;",
                muted: "muted"
            })
            $(self.options.mainContainerEl + ' .row').append(video);
            attachMediaStream($("#"+self.room).get(0), stream);
            self.hideLoading();
            $("#"+self.room).get(0).muted = "muted";
            $(self.options.startBroadcastEl + ' span').html('Stop');
        }

        broadcastConstructor.prototype.publishFeed = function(pluginHandle){
            var self = this;
            pluginHandle.createOffer(
                {
                    media: { audioRecv: false, videoRecv: false },
                    success: function(jsep){
                        console.log("Got publisher SDP!");
                        var publish = { "request":"configure", "audio":true, "video":true };
                        pluginHandle.send({"message":publish, "jsep":jsep})
                    },
                    error: function(error) {
              				  console.log("WebRTC error:");
              		      console.log(error);
              			}
                }
            )
        }

        broadcastConstructor.prototype.registerUser = function(pluginHandle){
            var self = this;
            // Generate random anon / username
            var username = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for( var i=0; i < 5; i++ ){
                username += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            // Generate random room
            var room = Math.floor(Math.random()*11);
            self.room = room;

            var register = {"request":"create", "room":room, "ptype":"publisher", "display":username}
            pluginHandle.send({"message":register});
            console.log("Registered");
        }

        broadcastConstructor.prototype.loading = function(){
            var self = this;
            // Hide all the other contents
            $(self.options.mainContainerEl + ' .row div').hide();
            $(self.options.loadingEl).show();
        }

        broadcastConstructor.prototype.updateLoading = function(str){
            var self = this;
            $(self.options.mainContainerEl + ' .loading h1 span').html(str);
        }

        broadcastConstructor.prototype.hideLoading = function(){
            var self = this;
            $(self.options.loadingEl).hide();
        }

        return broadcastConstructor;
    }());
})(jQuery,PubSub,Janus);
