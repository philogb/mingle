# Multilevel Agglomerative Edge Bundling in JavaScript

This is a JavaScript implementation of the paper [Multilevel Agglomerative Edge Bundling
for Visualizing Large Graphs](http://www2.research.att.com/~yifanhu/PUB/edge_bundling.pdf)
 (Emden R. Gansner, Yifan Hu, Stephen North, Carlos Scheidegger).

The edge bundling algorithm groups edges together to minimize the amount of
ink used to render a graph. This particular paper introduces a fast
technique to perform edge bundling.

Take for example this map connecting locations between the east coast in
the US and western Europe:

![easteurope image 1](https://raw.github.com/philogb/mingle/master/img/easteurope1.png)

The algorithm creates a proximity graph for the edges where each of the
edges is represented by a node. Then the algorithm bundles edges as long
as we're saving some ink in the final rendering. Here's an intermediate
step on the bundling animation:

![easteurope image 1](https://raw.github.com/philogb/mingle/master/img/easteurope2.png)

And here's the final result:

![easteurope image 1](https://raw.github.com/philogb/mingle/master/img/easteurope3.png)


This implementation is solely based on the paper. The license for the code is MIT.

## Examples

This simple example shows links connecting locations in the Bay Area.
The rendering uses 2D Canvas but
could use any other rendering API.

[You can see an example here](http://philogb.github.io/mingle/examples/sf).

![Image of Edge bundling example](https://raw.github.com/philogb/mingle/master/img/sfcommute.png)

## Usage

Given a dataset consisting of an Array of elements with format:

      {
          "id": <string id>,
          "name": <string name>,
          "data": {
              "coords": [
                  <coord x from>,
                  <coord y from>,
                  <coord x to>,
                  <coord y to>
              ]
          }
      }

Then the code to create the bundled edges graph is:

      var bundle = new Bundler();
      bundle.setNodes(json);
      bundle.buildNearestNeighborGraph();
      bundle.MINGLE();

Finally, to render the graph we provide some helper functions that make
use of 2D canvas:

      bundle.graph.each(function(node) {
        ctx.strokeStyle = 'rgba(0, 200, 200, 0.2)';
        ctx.lineWidth = 2;
        var edges = node.unbundleEdges(delta);
        Bundler.Graph.renderBezier(ctx, edges);
      });



## External libraries used

 * kdtree implementation by Ubilabs can be found [here](https://github.com/ubilabs/kd-tree-javascript).
MIT license.
 * [PhiloGL](http://senchalabs.org/philogl) is used to perform
   animations between unbundled and bundled edges. This library is not
required to use the algorithm. MIT license.

## TODO

Provide a more complete documentation and API reference.

## Copyright Twitter, Inc.

The code is copyright Twitter, Inc. with an MIT license.

        Copyright (c) 2013 Twitter - Author: Nicolas Garcia Belmonte
        (http://philogb.github.io/)

        Permission is hereby granted, free of charge, to any person obtaining a copy
        of this software and associated documentation files (the "Software"), to deal
        in the Software without restriction, including without limitation the rights
        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
        copies of the Software, and to permit persons to whom the Software is
        furnished to do so, subject to the following conditions:

        The above copyright notice and this permission notice shall be included in
        all copies or substantial portions of the Software.

        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
        LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
        OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
        THE SOFTWARE.

