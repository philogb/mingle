;(function () {

  //General convenience functions and constants
  Math.PHI = (1 + Math.sqrt(5)) / 2;

  function $dist(a, b) {
    var diffX = a[0] - b[0],
        diffY = a[1] - b[1];
    return Math.sqrt(diffX * diffX + diffY * diffY);
  }

  function $norm(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  }

  function $lerp(a, b, delta) {
    return [ a[0] * (1 - delta) + b[0] * delta,
             a[1] * (1 - delta) + b[1] * delta ];
  }

  function $add(a, b) {
    return [ a[0] + b[0], a[1] + b[1] ];
  }

  function $sub(a, b) {
    return [ a[0] - b[0], a[1] - b[1] ];
  }

  function $dot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }

  function $mult(k, a) {
    return [ a[0] * k, a[1] * k ];
  }

  function $lerpPoint(from, to, delta) {
    return [ $lerp(from[0], to[0], delta), $lerp(from[1], to[1], delta) ];
  }


  //Extend generic Graph class with bundle methods and rendering options
  function expandEdgesHelper(node, array, collect) {
    var coords = node.data.coords, i, l, p, ps;

    if (!array.length) {
      array.push([ (coords[0] + coords[2]) / 2,
                 (coords[1] + coords[3]) / 2 ]);
    }

    array.unshift([ coords[0], coords[1] ]);
    array.push ([ coords[2], coords[3] ]);
    ps = node.data.parents;
    if (ps) {
      for (i = 0, l = ps.length; i < l; ++i) {
        expandEdgesHelper(ps[i], array.slice(), collect);
      }
    } else {
      collect.push(array);
    }
  }

  Graph.Node.prototype.expandEdges = function() {
    if (this.expandedEdges) {
      return this.expandedEdges;
    }
    var ans = [];
    expandEdgesHelper(this, [], ans);
    this.expandedEdges = ans;
    return ans;
  };

  Graph.Node.prototype.unbundleEdges = function(delta) {
    var expandedEdges = this.expandEdges(),
        ans = Array(expandedEdges.length),
        min = Math.min,
        i, l, j, n, edge, edgeCopy,
        x0, xk, xk_x0, xi, xi_x0, xi_bar, dot, norm, norm2, c;

    delta = delta || 0;
    this.unbundledEdges = this.unbundledEdges || {};

    if ((delta === 0 || delta === 1) &&
        this.unbundledEdges[delta]) {
      return this.unbundledEdges[delta];
    }

    for (i = 0, l = expandedEdges.length; i < l; ++i) {
      edge = expandedEdges[i];
      edgeCopy = edge.slice();
      x0 = edge[0];
      xk = edge[edge.length -1];
      xk_x0 = $sub(xk, x0);
      for (j = 1, n = edge.length -1; j < n; ++j) {
        xi = edge[j];
        xi_x0 = $sub(xi, x0);
        dot = $dot(xi_x0, xk_x0);
        norm = $dist(xk, x0);
        norm2 = norm * norm;
        c = dot / norm2;
        xi_bar = $add(x0, $mult(c, xk_x0));
        edgeCopy[j] = $lerp(xi_bar, xi, delta);
      }
      ans[i] = edgeCopy;
    }

    if (delta === 0 || delta === 1) {
      this.unbundledEdges[delta] = ans;
    }

    return ans;
  };

  Graph.Render = {
    renderLine: function(ctx, edges, options) {
      options = options || {};
      var lineWidth = options.lineWidth || 1,
          fillStyle = options.fillStyle || 'gray',
          i, l, j, n, e, pos;

      ctx.fillStyle = fillStyle;
      ctx.lineWidth = lineWidth;
      for (i = 0, l = edges.length; i < l; ++i) {
        e = edges[i];
        ctx.beginPath();
        for (j = 0, n = e.length; j < n; ++j) {
          pos = e[j];
          if (j == 0) {
            ctx.moveTo(pos[0], pos[1]);
          } else {
            ctx.lineTo(pos[0], pos[1]);
          }
        }
        ctx.stroke();
        ctx.closePath();
      }
    },

    renderBezier: function(ctx, edges, options) {
      options = options || {};
      var pct = options.curviness || 0,
          i, l, j, n, e, pos, midpoint, c1, c2, start, end;

      for (i = 0, l = edges.length; i < l; ++i) {
        e = edges[i];
        start = e[0];
        midpoint = e[(e.length - 1) / 2];
        if (e.length > 3) {
          c1 = e[1];
          c2 = e[(e.length - 1) / 2 - 1];
          end = $lerp(midpoint, c2, pct);
          ctx.beginPath();
          ctx.moveTo(start[0], start[1]);
          ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], end[0], end[1]);
          c1 = e[(e.length - 1) / 2 + 1];
          c2 = e[e.length - 2];
          end = e[e.length - 1];
          if (pct) {
            //line to midpoint + pct of something
            start = $lerp(midpoint, c1, pct);
            ctx.lineTo(start[0], start[1]);
          }
          ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], end[0], end[1]);
          ctx.stroke();
          ctx.closePath();
        } else {
          ctx.beginPath();
          ctx.moveTo(start[0], start[1]);
          end = e[e.length -1];
          ctx.lineTo(end[0], end[1]);
        }
      }
    }
  };


  //Edge bundling algorithm class.
  function Bundler(options) {
    this.options = options || {};
    this.graph = new Graph();
    this.kdTree = null;
  }

  //copy static methods to render lines and other from Graph
  Bundler.Graph = Graph.Render;

  Bundler.prototype = {
    setNodes: function(nodes) {
      var i, l, graph = this.graph;
      graph.clear();
      for (i = 0, l = nodes.length; i < l; ++i) {
        graph.addNode(nodes[i]);
      }
    },

    buildKdTree: function() {
      var nodeArray = [];
      this.graph.each(function(n) {
        var coords = n.data.coords;
        n.x = coords[0];
        n.y = coords[1];
        n.z = coords[2];
        n.w = coords[3];
        nodeArray.push(n);
      });

      this.kdTree = new KdTree(nodeArray, function(a, b) {
        var diff0 = a.x - b.x,
            diff1 = a.y - b.y,
            diff2 = a.z - b.z,
            diff3 = a.w - b.w;

        return Math.sqrt(diff0 * diff0 + diff1 * diff1 + diff2 * diff2 + diff3 * diff3);
      }, ['x', 'y', 'z', 'w']);
    },

    buildNearestNeighborGraph: function(k) {
      k = k || 10;
      var graph = this.graph, node, dist, kdTree;
      this.buildKdTree();
      kdTree = this.kdTree;
      graph.each(function(n) {
        var nodes = kdTree.nearest(n, k), i, l;
        for (i = 0, l = nodes.length; i < l; ++i) {
          node = nodes[i][0];
          dist = nodes[i][1];
          if (node.id != n.id) {
            graph.addEdge(n, node);
          }
        }
      });
    },

    computeIntermediateNodePositions: function(node) {
      var m1, m2, centroids, a, b, c, tau, f, res;
      if (!node.data.nodes) {
        return;
      }
      centroids = this.getCentroids(node.data.nodes);
      f = this.costFunction.bind(this, node, centroids);
      a = 0;
      b = 1;
      c = 0.72; //because computers
      tau = 0.1;
      res = this.goldenSectionSearch(a, b, c, tau, f);
      f(res); //set m1 and m2;
    },

    costFunction: function(node, centroids, x) {
        var top, bottom, m1, m2, ink, alpha, p;
        x /= 2;
        top = centroids[0];
        bottom = centroids[1];
        m1 = $lerp(top, bottom, x);
        m2 = $lerp(top, bottom, 1 - x);
        node.data.m1 = m1;
        node.data.m2 = m2;
        delete node.data.ink;
        ink = this.getInkValue(node);
        alpha = this.getMaxTurningAngleValue(node, m1, m2);
        p = this.options.angleStrength || 25;
        return ink * (1 + Math.sin(alpha) / p);
    },

    goldenSectionSearch: function(a, b, c, tau, f) {
      var phi = Math.PHI,
          resphi = 2 - Math.PHI,
          abs = Math.abs, x;

      if (c - b > b - a) {
        x = b + resphi * (c - b);
      } else {
        x = b - resphi * (b - a);
      }
      if (abs(c - a) < tau * (abs(b) + abs(x))) {
        return (c + a) / 2;
      }
      if (f(x) < f(b)) {
        if (c - b > b - a) {
          return this.goldenSectionSearch(b, x, c, tau, f);
        }
        return this.goldenSectionSearch(a, x, b, tau, f);
      }
      if (c - b > b - a) {
        return this.goldenSectionSearch(a, b, x, tau, f);
      }
      return this.goldenSectionSearch(x, b, c, tau, f);
    },

    getCentroids: function(nodes) {
      var topCentroid = [0, 0],
          bottomCentroid = [0, 0],
          coords, i, l;

      for (i = 0, l = nodes.length; i < l; ++i) {
        coords = nodes[i].data.coords;
        topCentroid[0] += coords[0];
        topCentroid[1] += coords[1];
        bottomCentroid[0] += coords[2];
        bottomCentroid[1] += coords[3];
      }

      topCentroid[0] /= l;
      topCentroid[1] /= l;
      bottomCentroid[0] /= l;
      bottomCentroid[1] /= l;

      return [ topCentroid, bottomCentroid ];
    },

    getInkValue: function(node, depth) {
      var data = node.data,
          sqrt = Math.sqrt,
          coords, diffX, diffY,
          m1, m2, acum, i, l, nodes,
          ni;

      depth = depth || 0;

      //bundled node
      if (!depth && (data.bundle || data.nodes)) {
        nodes = data.bundle ? data.bundle.data.nodes : data.nodes;
        m1 = data.m1;
        m2 = data.m2;
        acum = 0;
        for (i = 0, l = nodes.length; i < l; ++i) {
          ni = nodes[i];
          coords = ni.data.coords;
          diffX = m1[0] - coords[0];
          diffY = m1[1] - coords[1];
          acum += $norm([ diffX, diffY ]);
          diffX = m2[0] - coords[2];
          diffY = m2[1] - coords[3];
          acum += $norm([ diffX, diffY ]);
          acum += this.getInkValue(ni, depth + 1);
        }
        if (!depth) {
          acum += $dist(m1, m2);
        }
        return (node.data.ink = acum);
      }

      //coalesced node
      if (data.parents) {
        nodes = data.parents;
        m1 = [ data.coords[0], data.coords[1] ];
        m2 = [ data.coords[2], data.coords[3] ];
        acum = 0;
        for (i = 0, l = nodes.length; i < l; ++i) {
          ni = nodes[i];
          coords = ni.data.coords;
          diffX = m1[0] - coords[0];
          diffY = m1[1] - coords[1];
          acum += $norm([ diffX, diffY ]);
          diffX = m2[0] - coords[2];
          diffY = m2[1] - coords[3];
          acum += $norm([ diffX, diffY ]);
          acum += this.getInkValue(ni, depth + 1);
        }
        //only add the distance if this is the first recursion
        if (!depth) {
          acum += $dist(m1, m2);
        }
        return (node.data.ink = acum);
      }

      //simple node
      if (depth) {
        return (node.data.ink = 0);
      }
      coords = node.data.coords;
      diffX = coords[0] - coords[2];
      diffY = coords[1] - coords[3];
      return (node.data.ink = $norm([ diffX, diffY ]));

    },

    getMaxTurningAngleValue: function(node, m1, m2) {
      var sqrt = Math.sqrt,
          abs = Math.abs,
          acos = Math.acos,
          m2Tom1 = [ m1[0] - m2[0], m1[1] - m2[1] ],
          m1Tom2 = [ -m2Tom1[0], -m2Tom1[1] ],
          m1m2Norm = $norm(m2Tom1),
          angle = 0, nodes, vec, norm, dot, angleValue,
          x, y, coords, i, l, n;

      if (node.data.bundle || node.data.nodes) {
        nodes = node.data.bundle ? node.data.bundle.data.nodes : node.data.nodes;
        for (i = 0, l = nodes.length; i < l; ++i) {
          coords = nodes[i].data.coords;
          vec = [ coords[0] - m1[0], coords[1] - m1[1] ];
          norm = $norm(vec);
          dot = vec[0] * m2Tom1[0] + vec[1] * m2Tom1[1];
          angleValue = abs(acos(dot / norm / m1m2Norm));
          angle = angle < angleValue ? angleValue : angle;

          vec = [ coords[2] - m2[0], coords[3] - m2[1] ];
          norm = $norm(vec);
          dot = vec[0] * m1Tom2[0] + vec[1] * m1Tom2[1];
          angleValue = abs(acos(dot / norm / m1m2Norm));
          angle = angle < angleValue ? angleValue : angle;
        }

        return angle;
      }

      return -1;
    },

    getCombinedNode: function(node1, node2, data) {
      node1 = node1.data.bundle || node1;
      node2 = node2.data.bundle || node2;

      var id = node1.id + '-' + node2.id,
          name = node1.name + '-' + node2.name,
          nodes1 = node1.data.nodes || [ node1 ],
          nodes2 = node2.data.nodes || [ node2 ],
          nodes = [], ans;

      if (node1.id == node2.id) {
        return node1;
      }

      nodes.push.apply(nodes, nodes1);
      nodes.push.apply(nodes, nodes2);
      data = data || {};
      data.nodes = nodes;
      ans = {
        id: id,
        name: name,
        data: data
      };

      this.computeIntermediateNodePositions(ans);

      return ans;
    },

    coalesceNodes: function(nodes) {
      var node = nodes[0],
          data = node.data,
          m1 = data.m1,
          m2 = data.m2,
          coords = data.coords,
          bundle = data.bundle,
          nodesArray;

      if (m1) {
        coords = [ m1[0], m1[1], m2[0], m2[1] ];
        return {
          id: bundle.id,
          name: bundle.id,
          data: {
            parents: nodes,
            coords: coords,
            parentsInk: bundle.data.ink
          }
        };
      }

      return nodes[0];
     },

    bundle: function(combinedNode, node1, node2) {
      var graph = this.graph;

      node1.data.bundle = combinedNode;
      node2.data.bundle = combinedNode;

      node1.data.ink = combinedNode.data.ink;
      node1.data.m1 = combinedNode.data.m1;
      node1.data.m2 = combinedNode.data.m2;

      node2.data.ink = combinedNode.data.ink;
      node2.data.m1 = combinedNode.data.m1;
      node2.data.m2 = combinedNode.data.m2;
    },

    updateGraph: function(graph, groupedNode, nodes, ids) {
      var i, l, n, connections,
      checkConnection = function(e) {
        var nodeToId = e.nodeTo.id;
        if (!ids[nodeToId]) {
          connections.push(e.nodeTo);
        }
      };
      for (i = 0, l = nodes.length; i < l; ++i) {
        n = nodes[i];
        connections = [];
        n.eachEdge(checkConnection);
        graph.removeNode(n.id);
      }
      graph.addNode(groupedNode);
      for (i = 0, l = connections.length; i < l; ++i) {
        graph.addEdge(groupedNode, connections[i]);
      }
    },

    coalesceGraph: function() {
      var graph = this.graph,
          newGraph = new Graph(),
          groupsIds = {},
          maxGroup = -Infinity,
          nodes, i, l, ids, groupedNode, connections,
          updateGraph = this.updateGraph,
          coalesceNodes = this.coalesceNodes;

      graph.each(function(node) {
        var group = node.data.group;
        if (maxGroup < group) {
          maxGroup = group;
        }
        if (!groupsIds[group]) {
          groupsIds[group] = {};
        }
        groupsIds[group][node.id] = node;
      });

      maxGroup++;
      while (maxGroup--) {
        ids = groupsIds[maxGroup];
        nodes = [];
        for (i in ids) {
          nodes.push(ids[i]);
        }
        if (nodes.length) {
          groupedNode = coalesceNodes(nodes);
          updateGraph(graph, groupedNode, nodes, ids);
        }
      }
    },

    getMaximumInkSavingNeighbor: function(n) {
      var nodeFrom = n,
          getInkValue = this.getInkValue.bind(this),
          inkFrom = getInkValue(nodeFrom),
          combineNodes = this.getCombinedNode.bind(this),
          inkTotal = Infinity,
          bundle = Array(2),
          combinedBundle;

      n.eachEdge(function(e) {
        var nodeTo = e.nodeTo,
            inkTo = getInkValue(nodeTo),
            combined = combineNodes(nodeFrom, nodeTo),
            inkUnion = getInkValue(combined),
            inkValue = inkUnion - (inkFrom + inkTo);

        if (inkTotal > inkValue) {
          inkTotal = inkValue;
          bundle[0] = nodeFrom;
          bundle[1] = nodeTo;
          combinedBundle = combined;
        }
      });

      return {
        bundle: bundle,
        inkTotal: inkTotal,
        combined: combinedBundle
      };
    },

    MINGLE: function() {
      var edgeProximityGraph = this.graph,
          that = this,
          totalGain = 0,
          ungrouped = -1,
          gain = 0,
          k = 0,
          clean = function(n) { n.data.group = ungrouped; },
          nodeMingle = function(node) {
            if (node.data.group == ungrouped) {
              var ans = that.getMaximumInkSavingNeighbor(node),
                  bundle = ans.bundle,
                  u = bundle[0],
                  v = bundle[1],
                  combined = ans.combined,
                  gainUV = -ans.inkTotal;

              //graph has been collapsed and is now only one node
              if (!u && !v) {
                gain = -Infinity;
                return;
              }

              if (gainUV > 0) {
                that.bundle(combined, u, v);
                gain += gainUV;
                if (v.data.group != ungrouped) {
                  u.data.group = v.data.group;
                } else {
                  u.data.group = v.data.group = k;
                }
              } else {
                u.data.group = k;
              }
              k++;
            }
          };

      do {
        gain = 0;
        k = 0;
        edgeProximityGraph.each(clean);
        edgeProximityGraph.each(nodeMingle);
        this.coalesceGraph();
        totalGain += gain;
      } while (gain > 0);
    }
  };

  this.Bundler = Bundler;

})();

