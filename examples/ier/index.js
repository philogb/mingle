/*global PhiloGL*/
(function() {

PhiloGL.unpack();

var delta = 1,
    type = 'Quadratic',
    neighbors = 10,
    angleStrength = 3,
    curviness = 1,
    margin = 0,
    alpha = 0.5,
    color = '#00cccc',
    clusterColors = ["#FB8072", "#80B1D3", "#8DD3C7", "#FCCDE5", "#FDB462", "#FFFFB3", "#BEBADA", "#CCEBC5", "#B3DE69", "#BC80BD", "#FFED6F"],
    colorType = 'Solid',
    counter = 0,
    dataset = 'philippines',
    canvas = document.querySelector('canvas#renderer'),
    background = document.querySelector('.world-map'),
    dotsCanvas = document.querySelector('canvas#dots'),
    ctx = canvas.getContext('2d'),
    dotsCtx = dotsCanvas.getContext('2d'),
    ink = document.querySelector('#ink'),
    container = document.querySelector('.container'),
    directionSort = function(a, b) {
      var aColor, bColor;
      if (Array.isArray(a.data.color)) {
        aColor = a.data.color[0];
        bColor = b.data.color[0];
        if (aColor == bColor) {
          return 0;
        }
        return aColor > bColor ? 1 : -1;
      }
    },
    xSort = function(a, b) {
      var diffX = a.data.coords[0] - b.data.coords[0],
          diffY = a.data.coords[1] - b.data.coords[1];
      if (!diffX) {
        return diffY;
      }
      return diffX;
    },
    ySort = function(a, b) {
      var diffX = a.data.coords[0] - b.data.coords[0],
          diffY = a.data.coords[1] - b.data.coords[1];
      if (!diffY) {
        return diffX;
      }
      return -diffY;
    },
    componentSort = function(a, b) {
      var diffX = Math.abs(a.data.coords[0] - b.data.coords[2]),
          diffY = Math.abs(a.data.coords[1] - b.data.coords[3]);

      return diffX > diffY ? ySort(a, b) : xSort(a, b);
    },
    sortOptions = [ null, componentSort, xSort, ySort, directionSort ],
    sortType = null,
    options,
    imageData,
    jsonText,
    json,
    bundle,
    loader;

function updateBundle() {
  bundle.options.angleStrength = angleStrength;
  bundle.options.sort = sortType;
  bundle.setNodes(JSON.parse(jsonText));
  //ensure the direction is calculated before computing the graph.
  bundle.graph.each(function(n) {
    if (colorType == 'Direction') {
      if (!Array.isArray(n.data.color)) {
        n.data.color = Math.random() > 0.5 ? ['#0083ce', '#cf4846'] : ['#0083ce', '#cf4846'].reverse();
      }
    }
  });
  bundle.buildNearestNeighborGraph(neighbors);
  bundle.MINGLE();
}

function calculateInk() {
  imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for (var i = 0, l = imageData.length, acum = 0; i < l; i += 4) {
    if (imageData[i + 3] != 0) {
      acum++;
    }
  }
  ink.innerText = Math.round((acum / (canvas.width * canvas.height)) * 10000) / 100;
}

(function loop() {
  Fx.requestAnimationFrame(loop);
}());

function animate(bundle, canvas, ctx) {
  var loading = document.querySelector('.loading');
  if (loading && loading.parentNode) {
    loading.parentNode.removeChild(loading);
  }

  new Fx({
    transition: Fx.Transition.Quart.easeInOut,
    duration: 1000
  }).start({
    onCompute: function(epsilon) {
      delta = epsilon;
      render();
    }
  });

}

dotsCanvas = document.querySelector('canvas#dots');
dotsCtx = dotsCanvas.getContext('2d');

  function renderPoints() {
    dotsCtx.fillStyle = '#000';
    dotsCanvas.width = dotsCanvas.width;
    json.forEach(function(edge) {
      dotsCtx.beginPath();
      dotsCtx.arc(edge.data.coords[0], edge.data.coords[1], options.radius || 1, 0, Math.PI * 2, false);
      dotsCtx.fill();
      dotsCtx.closePath();
      dotsCtx.beginPath();
      dotsCtx.arc(edge.data.coords[2], edge.data.coords[3], options.radius || 1, 0, Math.PI * 2, false);
      dotsCtx.fill();
      dotsCtx.closePath();
    });
  }

  function render() {
    canvas.width = canvas.width;
    ctx.strokeStyle = 'rgba(0, 200, 200, 1)';
    ctx.lineWidth = 1;
    counter = 0;
    bundle.graph.each(function(node) {
      var i = counter;
      if (node.data.nodeArray) {
        node.data.nodeArray.forEach(function(n, j) {
          if (colorType == 'Cluster') {
            n.data.color = clusterColors[i % clusterColors.length];
          } else if (colorType == 'Solid') {
            n.data.color = color;
          } else if (colorType == 'Edge') {
            n.data.color = clusterColors[j % clusterColors.length];
          } else if (colorType == 'Direction') {
            if (!Array.isArray(n.data.color)) {
              n.data.color = Math.random() > 0.5 ? ['#0083ce', '#cf4846'] : ['#0083ce', '#cf4846'].reverse();
            }
          }
          n.data.alpha = alpha;
        });
      }
      var edges = node.unbundleEdges(delta);
      Bundler.Graph['render' + type](ctx, edges, {
        delta: delta,
        margin: margin,
        curviness: curviness,
        scale: options.scale
      });
      counter++;
    });
    calculateInk();
  }

  var bundleLabel = document.querySelector('#bundle-level-span');
  bundleLabel.innerText = Math.round(delta * 1000) / 10 + '%';
  document.querySelector('#bundle-level').addEventListener('mousemove', function() {
    delta = +this.value;
    bundleLabel.innerText = Math.round(delta * 1000) / 10 + '%';
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  var curvinessLabel = document.querySelector('#curviness-span');
  curvinessLabel.innerText = Math.round(curviness * 1000) / 10 + '%';
  document.querySelector('#curviness').addEventListener('mousemove', function() {
    curviness = +this.value;
    curvinessLabel.innerText = Math.round(curviness * 1000) / 10 + '%';
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  var marginLabel = document.querySelector('#margin-span');
  marginLabel.innerText = Math.round(margin * 10) / 10;
  document.querySelector('#margin').addEventListener('mousemove', function() {
    margin = +this.value;
    marginLabel.innerText = Math.round(margin * 10) / 10;
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  var angleLabel = document.querySelector('#angle-strength-span');
  angleLabel.innerText = Math.round(angleStrength * 10) / 10;
  document.querySelector('#angle-strength').addEventListener('change', function() {
    angleStrength = +this.value;
    angleLabel.innerText = Math.round(angleStrength * 10) / 10;
    updateBundle();
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  var neighborsLabel = document.querySelector('#neighbors-span');
  neighborsLabel.innerText = Math.round(neighbors * 10) / 10;
  document.querySelector('#neighbors').addEventListener('change', function() {
    neighbors = +this.value;
    neighborsLabel.innerText = Math.round(neighbors * 10) / 10;
    updateBundle();
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  document.querySelector('#line-type').addEventListener('change', function() {
    type = this.value;
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  document.querySelector('#color').addEventListener('change', function() {
    color = this.value;
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  var alphaLabel = document.querySelector('#alpha-span');
  alphaLabel.innerText = Math.round(alpha * 10) / 10;
  document.querySelector('#alpha').addEventListener('mousemove', function() {
    alpha = this.value;
    alphaLabel.innerText = Math.round(alpha * 10) / 10;
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  document.querySelector('#color-type').addEventListener('change', function() {
    colorType = this.value;
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  document.querySelector('#dataset').addEventListener('change', function() {
    dataset = this.value;
    load();
  });

  document.querySelector('#sort-type').addEventListener('change', function() {
    sortType = sortOptions[ this.selectedIndex ];
    updateBundle();
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  loader = new Loader();
  function load() {
    options = loader.load(dataset, {
      complete: function(data) {
        if (!data.length) {
          console.warn('no data returned');
          return;
        }
        if (data.length > 5e3) {
          console.warn('data is too big', data.length);
          return;
        }
        background.className = 'world-map ' + dataset;
        canvas.width = dotsCanvas.width = options.width;
        canvas.height = dotsCanvas.height = options.height;

        canvas.style.width = dotsCanvas.style.width = (options.width / (options.ratio || 1)) + 'px';
        canvas.style.height = dotsCanvas.style.height = (options.height / (options.ratio || 1)) + 'px';

        container.style.width = canvas.offsetWidth + 'px';
        background.style.width = canvas.offsetWidth + 'px';
        background.style.height = canvas.offsetHeight + 'px';

        json = data;
        renderPoints();
        jsonText = JSON.stringify(json);
        console.time('MINGLE');
        bundle = new Bundler();
        bundle.options.angleStrength = angleStrength;
        bundle.options.sort = sortType;
        bundle.setNodes(json);
        bundle.graph.each(function(n) {
          if (colorType == 'Direction') {
            if (!Array.isArray(n.data.color)) {
              n.data.color = Math.random() > 0.5 ? ['#0083ce', '#cf4846'] : ['#0083ce', '#cf4846'].reverse();
            }
          }
        });
        bundle.buildNearestNeighborGraph(neighbors);
        bundle.MINGLE();
        console.timeEnd('MINGLE');
        animate(bundle, canvas, ctx);
      }
    });
  }
  load();

})();
