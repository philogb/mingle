/*global PhiloGL, Float32Array */
(function () {
   Array.prototype.shuffle = function() {
     var len = this.length,
     rnd = Math.random,
     round = Math.round,
     i, index, aux;

     for (i = 0; i < len; ++i) {
       index = round(i + rnd() * (len - i - 1));
       aux = this[i];
       this[i] = this[index];
       this[index] = aux;
     }
     return this;
   };

   function graticulize(n, ratio) {
    var mod = n % ratio,
        nDiv = Math.floor(n / ratio),
        halfRatio = ratio / 2;

    if (mod > halfRatio) {
      return (nDiv + 1) * ratio;
    }

    return nDiv * ratio;
   }

    var colors = ["#E99774", "#F0C532", "#F3861E", "#EAD1A6", "#BA9A43", "#E79A50", "#F6D071", "#CAA572", "#E69C1E", "#F2825B", "#C29E20", "#F2B54D", "#F08741","#EDBF7B","#D59634","#ECBD9B","#F5B527","#F1C957","#E0A855","#C1A481","#EFD195","#E49B62","#C9A35F","#D3AE40","#F1A142","#C99444","#F7BC66","#DFBC5F","#D28E68","#C9A84E"].shuffle();
    var colors2 = ["#8DD3C7", "#FFFFB3", "#BEBADA", "#FB8072", "#80B1D3", "#FDB462", "#B3DE69", "#FCCDE5"/*, "#D9D9D9"*/, "#BC80BD", "#CCEBC5", "#FFED6F"];

    function Loader(options) {
      this.options = options;
    }

    Loader.prototype = {

     philippines : {
        url: '../data/json/philippines.json',
        scale: 2,
        latFrom: -90,
        latTo: 90,
        lonFrom: -180,
        lonTo: 180,
        width: 1500,
        height: 1500 * (90 - -90) / (180 - -180),
        ratio: 1,
        lineWidth: 0.5,
        radius: 3,
        fillStyle: 'rgba(0, 200, 200, 0.8)',
        strokeStyle: colors2
      },

      sfcommute: {
        url: '../data/json/sfcommute.json',
        scale: 1.5,
        latFrom: 37.37,
        latTo: 37.86,
        lonFrom: -122.52,
        lonTo: -122.0,
        ratio: 1,
        lineWidth: 2,
        radius: 1,
        fillStyle: 'rgba(10, 10, 10, 0.01)',
        //strokeStyle: colors,
        strokeStyle: 'rgba(0, 200, 200, 0.2)',
        width: 600,
        height: 600 * (37.86 - 37.37) / (-122 - -122.52)
      },

      world: {
        url: '../data/json/world.json',
        scale: 1,
        latFrom: -90,
        latTo: 90,
        lonFrom: -180,
        lonTo: 180,
        ratio: 2,
        width: 2000,
        height: 2000 * (90 - -90) / (180 - -180),
        lineWidth: 1,
        radius: 3,
        fillStyle: 'rgba(10, 10, 10, 0.01)',
        //strokeStyle: colors,
        strokeStyle: 'rgba(0, 200, 200, 0.1)'
      },

      eastwestcommute: {
        url: '../data/json/eastwestcommute.json',
        scale: 2,
        latFrom: 23.6,
        latTo: 67.7,
        lonFrom: -89,
        lonTo: 32,
        ratio: 1,
        lineWidth: 2,
        fillStyle: 'rgba(10, 10, 10, 1)',
        radius: 2,
        strokeStyle: colors,
        width: 1000,
        height: 1000 * (67.7 - 23.6) / (32 - -89)
      },

      test: {
        url: '../data/json/test.json',
        scale: 1,
        width: 1000,
        height: 500,
        ratio: 1,
        lineWidth: 2,
        radius: 3,
        fillStyle: 'rgba(10, 10, 10, 0.01)',
        strokeStyle: 'rgba(0, 200, 200, 0.2)',
      },

      testuneven: {
        url: '../data/json/testuneven.json',
        scale: 1,
        width: 1000,
        height: 500,
        ratio: 1,
        lineWidth: 2,
        radius: 3,
        fillStyle: 'rgba(10, 10, 10, 0.01)',
        strokeStyle: 'rgba(0, 200, 200, 0.2)'
      },

      testcrossed: {
        url: '../data/json/testcrossed.json',
        scale: 1,
        width: 1000,
        height: 500,
        ratio: 1,
        lineWidth: 2,
        radius: 3,
        fillStyle: 'rgba(10, 10, 10, 0.01)',
        //strokeStyle: colors,
        strokeStyle: 'rgba(0, 200, 200, 0.2)',
      },

      load: function(key, options) {
        this.options = this[key];
        this.options.complete = options.complete;
        this.send();
        return this.options;
      },

      send: function() {
        var that = this,
            options = this.options,
            url = options.url;

        new PhiloGL.IO.XHR({
          url: url,
          onSuccess: function(text) {
            var json = JSON.parse(text);
            if (options.parse) {
              json = options.parse(json);
            }
            if (options.complete) {
              options.complete(json, options);
            }
          },
          onError: function() {
            console.error('request failed');
          }
        }).send();
      }
    };

    this.Loader = Loader;

})();


