/*global PhiloGL, Bundler, IO, Fx*/
PhiloGL.unpack();

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
        Bundler.Graph.renderBezier(ctx, edges);
      });
    }
  });

  Fx.requestAnimationFrame(function loop() { Fx.requestAnimationFrame(loop); });
}

window.addEventListener('DOMContentLoaded', function() {
  var canvas = document.querySelector('canvas'),
      ctx = canvas.getContext('2d'),
      bundle;

  document.querySelector('#bundle-level').addEventListener('change', function() {
    var delta = +this.value;
    canvas.width = canvas.width;
    ctx.strokeStyle = 'rgba(0, 200, 200, 0.2)';
    ctx.lineWidth = 1;
    bundle.graph.each(function(node) {
      var edges = node.unbundleEdges(delta);
      Bundler.Graph.renderBezier(ctx, edges);
    });
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
