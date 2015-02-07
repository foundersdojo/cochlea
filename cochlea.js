//Waituntil DOM is loaded to start
$(document).ready(function() {
    // create the audio context (chrome only for now)
    if (! window.AudioContext) {
        if (! window.webkitAudioContext) {
            alert('no audiocontext found');
        }
        window.AudioContext = window.webkitAudioContext;
    }
    var context = new AudioContext();
    var audioBuffer;
    var sourceNode;
    var analyser;
    var javascriptNode;

    // get the context from the canvas to draw on
    var ctx = $("#canvas").get(0).getContext("2d");
    // create a gradient for the fill. Note the strange
    // offset, since the gradient is calculated based on
    // the canvas, not the specific element we draw
    var gradient = ctx.createLinearGradient(0,0,0,300);
    gradient.addColorStop(1,'#000000');
    gradient.addColorStop(0.75,'#ff0000');
    gradient.addColorStop(0.25,'#ffff00');
    gradient.addColorStop(0,'#ffffff');

    // load the sound
    setupAudioNodes();
    loadSound("demo.mp3");
    console.log('sound loaded');

    // Beat detection variables
    var beat_detected = true; 

    // Visualization globals
    var active_bg_color_idx = 0;
    var BG_COLORS = [
      "#F7977A",
      "#F9AD81",
      "#FDC68A",
      "#FFF79A",
      "#C4DF9B",
      "#A2D39C",
      "#82CA9D",
      "#7BCDC8",
      "#6ECFF6",
      "#7EA7D8",
      "#8493CA",
      "#8882BE",
      "#A187BE",
      "#BC8DBF",
      "#BC8DBF",
      "#F49AC2",
      "#F6989D"
    ];

    function setupAudioNodes() {
        // setup a javascript node
        javascriptNode = context.createScriptProcessor(2048, 1, 1);
        // connect to destination, else it isn't called
        javascriptNode.connect(context.destination);
        // setup a analyzer
        analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0.3;
        analyser.fftSize = 32;
        // create a buffer source node
        sourceNode = context.createBufferSource();
        sourceNode.connect(analyser);
        analyser.connect(javascriptNode);
        sourceNode.connect(context.destination);
    }

    // load the specified sound
    function loadSound(url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        // When loaded decode the data
        request.onload = function() {
            // decode the data
            context.decodeAudioData(request.response, function(buffer) {
                // when the audio is decoded play the sound
                console.log('success!')
                playSound(buffer);
            }, onError);
        }
        request.send();
        setInterval(swapBackground, 1000);
    }

    function playSound(buffer) {
        sourceNode.buffer = buffer;
        sourceNode.start(0);
    }

    // log if an error occurs
    function onError(e) {
        console.log("Error!");
        console.log(e);
    }

    // when the javascript node is called
    // we use information from the analyzer node
    // to draw the volume
    javascriptNode.onaudioprocess = function() {
        // get the average for the first channel
        var array =  new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        // clear the current state
        ctx.clearRect(0, 0, 1000, 325);
        // set the fill style
        ctx.fillStyle=gradient;
        drawSpectrum(array);
        if (detectBeat(array)) {
          swapBackgroundColor();
        }
    }

    function drawSpectrum(array) {
        for ( var i = 0; i < (array.length); i+=2 ){
            var value = array[i];
            // TODO: Change to gradient of white/grey?
            ctx.fillRect(i*25,325-value,20,325);
            //  console.log([i,value])
        }
    };

    /**
     * A "beat" is defined by volume of a particular band of spectrum
     * rising above a certain line. They're on 0-255 scale.
     * TODO: Figure out best band to use
     * TODO: Only swap on the "upswing", and ignore detection until after
     * it drops below that threshold again (otherwise seizure mode every frame
     * while the volume is above.
     * TODO: Need to do a moving average to smooth things out...?
     */
    function detectBeat(array) {
    }

    function swapBackground() {
      active_bg_color_idx = (active_bg_color_idx + 1) % BG_COLORS.length;
      $('body').css('background-color', BG_COLORS[active_bg_color_idx]);
    }

});