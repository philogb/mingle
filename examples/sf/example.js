/*global PhiloGL, Bundler, IO, Fx*/
PhiloGL.unpack();

var curviness = 0, margin = 0.3, type = 'Bezier', delta;

function animate(bundle, canvas, ctx) {
  var loading = document.querySelector('.loading');

  loading.parentNode.removeChild(loading);

  canvas.width = 700;
  canvas.height = 832;

  new Fx({
    transition: Fx.Transition.Quart.easeInOut,
    duration: 5000
  }).start({
    onCompute: function(delta) {
      canvas.width = canvas.width;
      ctx.strokeStyle = 'rgba(0, 200, 200, 0.2)';
      ctx.lineWidth = 1;
      bundle.graph.each(function(node) {
        var edges = node.unbundleEdges(delta);
        Bundler.Graph['render' + type](ctx, edges, {
          delta: delta,
          margin: margin,
          curviness: curviness
        });
      });
    }
  });

  Fx.requestAnimationFrame(function loop() { Fx.requestAnimationFrame(loop); });
}

window.addEventListener('DOMContentLoaded', function() {
  var canvas = document.querySelector('canvas'),
      ctx = canvas.getContext('2d'),
      bundle;

  function render() {
    canvas.width = canvas.width;
    ctx.strokeStyle = 'rgba(0, 200, 200, 0.2)';
    ctx.lineWidth = 1;
    bundle.graph.each(function(node) {
      var edges = node.unbundleEdges(delta);
      Bundler.Graph['render' + type](ctx, edges, {
        margin: margin,
        delta: delta,
        curviness: curviness
      });
    });
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

  document.querySelector('#line-type').addEventListener('change', function() {
    type = this.value;
    render(canvas, ctx, bundle, delta, type, curviness);
  });

  new IO.XHR({
    url: 'sample.json',
    onSuccess: function(json) {
      json = JSON.parse(json);

      bundle = new Bundler();
      bundle.setNodes(json);
      bundle.buildNearestNeighborGraph();
      bundle.MINGLE();

      animate(bundle, canvas, ctx);
    }
  }).send();
});
