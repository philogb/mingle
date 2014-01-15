/*global PhiloGL, Bundler, IO, Fx*/
PhiloGL.unpack();

window.addEventListener('DOMContentLoaded', function() {
  var canvas = document.querySelector('canvas'),
      ctx = canvas.getContext('2d'),
      delta = 1,
      type = 'Bezier',
      neighbors = 10,
      angleStrength = 10,
      curviness = 1,
      margin = 0,
      jsonText,
      bundle;

  function render(canvas, ctx, bundle, delta, type, curviness) {
    canvas.width = canvas.width;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    bundle.graph.each(function(node) {
      var edges = node.unbundleEdges(delta);
      Bundler.Graph['render' + type](ctx, edges, {
        curviness: curviness,
        delta: delta,
        margin: margin
      });
      //Bundler.Graph.renderLine(ctx, edges);
    });
  }

  function animate(bundle, canvas, ctx) {
    var loading = document.querySelector('.loading');

    loading.parentNode.removeChild(loading);

    new Fx({
      transition: Fx.Transition.Quart.easeInOut,
      duration: 1000
    }).start({
      onCompute: function(deltaValue) {
        delta = deltaValue;
        render(canvas, ctx, bundle, delta, type, curviness);
      }
    });

    Fx.requestAnimationFrame(function loop() { Fx.requestAnimationFrame(loop); });
  }

  function updateBundle() {
    bundle.options.angleStrength = angleStrength;
    bundle.setNodes(JSON.parse(jsonText));
    bundle.buildNearestNeighborGraph(neighbors);
    bundle.MINGLE();
  }

  document.querySelector('#bundle-level').addEventListener('change', function() {
    delta = +this.value;
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  document.querySelector('#curviness').addEventListener('change', function() {
    curviness = +this.value;
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  document.querySelector('#margin').addEventListener('change', function() {
    margin = +this.value;
    render(canvas, ctx, bundle, delta, type, curviness);
  });


  document.querySelector('#angle-strength').addEventListener('change', function() {
    angleStrength = +this.value;
    updateBundle();
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  document.querySelector('#neighbors').addEventListener('change', function() {
    neighbors = +this.value;
    updateBundle();
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  document.querySelector('#line-type').addEventListener('change', function() {
    type = this.value;
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  new IO.XHR({
    url: 'sample.json',
    onSuccess: function(json) {
      jsonText = json;
      json = JSON.parse(jsonText);

      bundle = new Bundler({
        angleStrength: angleStrength
      });
      bundle.setNodes(json);
      bundle.buildNearestNeighborGraph(neighbors);
      bundle.MINGLE();

      animate(bundle, canvas, ctx);
    }
  }).send();
});
