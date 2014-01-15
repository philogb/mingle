;(function () {

function descriptor(object) {
  var desc = {}, p;
  for (p in object) {
    desc[p] = {
      value: object[p],
      writable: true,
      enumerable: true,
      configurable: true
    };
  }
  return desc;
}

function merge(proto, object) {
  return Object.create(proto, descriptor(object));
}

function extend(proto, object) {
  var p;
  for (p in object) {
    proto[p] = object[p];
  }
}
/*
 * File: Graph.js
 *
*/

/*
 Class: Graph

 A Graph Class that provides useful manipulation functions. You can find more manipulation methods in the <Graph.Util> object.

 An instance of this class can be accessed by using the *graph* parameter of any tree or graph visualization.

 Example:

 (start code js)
   //create new visualization
   var viz = new $jit.Viz(options);
   //load JSON data
   viz.loadJSON(json);
   //access model
   viz.graph; //<Graph> instance
 (end code)

 Implements:

 The following <Graph.Util> methods are implemented in <Graph>

  - <Graph.Util.getNode>
  - <Graph.Util.eachNode>
  - <Graph.Util.computeLevels>
  - <Graph.Util.eachBFS>
  - <Graph.Util.clean>
  - <Graph.Util.getClosestNodeToPos>
  - <Graph.Util.getClosestNodeToOrigin>

*/

var Graph = function(opt) {
  this.opt = merge({
    node: {}
  }, opt || {});
  this.nodes = {};
  this.edges = {};
};

Graph.fromJSON = function(json) {
  var nodes = json.nodes,
      edges = json.edges,
      Node = Graph.Node,
      Edge = Graph.Edge,
      graph = new Graph(),
      k;

  for (k in nodes) {
    nodes[k] = Node.fromJSON(nodes[k]);
  }

  graph.nodes = nodes;

  for (k in edges) {
    edges[k] = Edge.fromJSON(graph, edges[k]);
  }

  graph.edges = edges;

  return graph;
};

Graph.prototype = {
  clear: function() {
    this.nodes = {};
    this.edges = {};
  },

  //serialize
  toJSON: function() {
    var nodes = [],
        edges = [],
        gNodes = this.nodes,
        gEdges = this.edges,
        k, from, to;

    for (k in gNodes) {
      nodes.push(gNodes[k].toJSON());
    }

    for (from in gEdges) {
      for (to in gEdges[from]) {
        edges.push(gEdges[from][to].toJSON());
      }
    }

    return { nodes: nodes, edges: edges };
  },

/*
     Method: getNode

     Returns a <Graph.Node> by *id*.

     Parameters:

     id - (string) A <Graph.Node> id.

     Example:

     (start code js)
       var node = graph.getNode('nodeId');
     (end code)
*/
 getNode: function(id) {
    if(this.hasNode(id)) return this.nodes[id];
    return false;
 },

 /*
     Method: get

     An alias for <Graph.Util.getNode>. Returns a node by *id*.

     Parameters:

     id - (string) A <Graph.Node> id.

     Example:

     (start code js)
       var node = graph.get('nodeId');
     (end code)
*/
  get: function(id) {
    return this.getNode(id);
  },

 /*
   Method: getByName

   Returns a <Graph.Node> by *name*.

   Parameters:

   name - (string) A <Graph.Node> name.

   Example:

   (start code js)
     var node = graph.getByName('someName');
   (end code)
  */
  getByName: function(name) {
    for(var id in this.nodes) {
      var n = this.nodes[id];
      if(n.name == name) return n;
    }
    return false;
  },

/*
   Method: getEdge

   Returns a <Graph.Edge> object connecting nodes with ids *id* and *id2*.

   Parameters:

   id - (string) A <Graph.Node> id.
   id2 - (string) A <Graph.Node> id.
*/
  getEdge: function (id, id2) {
    if(id in this.edges) {
      return this.edges[id][id2];
    }
    return false;
 },

    /*
     Method: addNode

     Adds a node.

     Parameters:

      obj - An object with the properties described below

      id - (string) A node id
      name - (string) A node's name
      data - (object) A node's data hash

    See also:
    <Graph.Node>

  */
  addNode: function(obj) {
   if(!this.nodes[obj.id]) {
     var edges = this.edges[obj.id] = {};
     this.nodes[obj.id] = new Graph.Node(merge({
        'id': obj.id,
        'name': obj.name,
        'data': merge(obj.data || {}, {}),
        'adjacencies': edges
      }, this.opt.node));
    }
    return this.nodes[obj.id];
  },

    /*
     Method: addEdge

     Connects nodes specified by *obj* and *obj2*. If not found, nodes are created.

     Parameters:

      obj - (object) A <Graph.Node> object.
      obj2 - (object) Another <Graph.Node> object.
      data - (object) A data object. Used to store some extra information in the <Graph.Edge> object created.

    See also:

    <Graph.Node>, <Graph.Edge>
    */
  addEdge: function (obj, obj2, data) {
    if(!this.hasNode(obj.id)) { this.addNode(obj); }
    if(!this.hasNode(obj2.id)) { this.addNode(obj2); }
    obj = this.nodes[obj.id]; obj2 = this.nodes[obj2.id];
    if(!obj.adjacentTo(obj2)) {
      var adjsObj = this.edges[obj.id] = this.edges[obj.id] || {};
      var adjsObj2 = this.edges[obj2.id] = this.edges[obj2.id] || {};
      adjsObj[obj2.id] = adjsObj2[obj.id] = new Graph.Edge(obj, obj2, data, this.Edge, this.Label);
      return adjsObj[obj2.id];
    }
    return this.edges[obj.id][obj2.id];
 },

    /*
     Method: removeNode

     Removes a <Graph.Node> matching the specified *id*.

     Parameters:

     id - (string) A node's id.

    */
  removeNode: function(id) {
    if(this.hasNode(id)) {
      delete this.nodes[id];
      var adjs = this.edges[id];
      for(var to in adjs) {
        delete this.edges[to][id];
      }
      delete this.edges[id];
    }
  },

/*
     Method: removeEdge

     Removes a <Graph.Edge> matching *id1* and *id2*.

     Parameters:

     id1 - (string) A <Graph.Node> id.
     id2 - (string) A <Graph.Node> id.
*/
  removeEdge: function(id1, id2) {
    delete this.edges[id1][id2];
    delete this.edges[id2][id1];
  },

   /*
     Method: hasNode

     Returns a boolean indicating if the node belongs to the <Graph> or not.

     Parameters:

        id - (string) Node id.
   */
  hasNode: function(id) {
    return id in this.nodes;
  },

  /*
    Method: empty

    Empties the Graph

  */
  empty: function() { this.nodes = {}; this.edges = {}; }

};

/*
     Class: Graph.Node

     A <Graph> node.

     Implements:

     <Accessors> methods.

     The following <Graph.Util> methods are implemented by <Graph.Node>

    - <Graph.Util.eachEdge>
    - <Graph.Util.eachLevel>
    - <Graph.Util.eachSubgraph>
    - <Graph.Util.eachSubnode>
    - <Graph.Util.anySubnode>
    - <Graph.Util.getSubnodes>
    - <Graph.Util.getParents>
    - <Graph.Util.isDescendantOf>
*/
Graph.Node = function(opt) {
  var innerOptions = {
    'id': '',
    'name': '',
    'data': {},
    'adjacencies': {}
  };
  extend(this, merge(innerOptions, opt));
};

Graph.Node.fromJSON = function(json) {
  return new Graph.Node(json);
};

Graph.Node.prototype = {
    toJSON: function() {
      return {
        id: this.id,
        name: this.name,
        data: this.serializeData(this.data)
      };
    },

    serializeData: function(data) {
      var serializedData = {},
          parents = data.parents,
          parentsCopy, i, l;

      if (parents) {
        parentsCopy = Array(parents.length);
        for (i = 0, l = parents.length; i < l; ++i) {
          parentsCopy[i] = parents[i].toJSON();
        }
      }

      for (i in data) {
        serializedData[i] = data[i];
      }

      delete serializedData.parents;
      delete serializedData.bundle;
      serializedData = JSON.parse(JSON.stringify(serializedData));

      if (parentsCopy) {
        serializedData.parents = parentsCopy;
      }

      return serializedData;
    },

    /*
       Method: adjacentTo

       Indicates if the node is adjacent to the node specified by id

       Parameters:

          id - (string) A node id.

       Example:
       (start code js)
        node.adjacentTo('nodeId') == true;
       (end code)
    */
    adjacentTo: function(node) {
        return node.id in this.adjacencies;
    },

    /*
       Method: getAdjacency

       Returns a <Graph.Edge> object connecting the current <Graph.Node> and the node having *id* as id.

       Parameters:

          id - (string) A node id.
    */
    getEdge: function(id) {
        return this.adjacencies[id];
    },

    /*
       Method: toString

       Returns a String with information on the Node.

    */
    toString: function() {
      return 'Node(' + JSON.stringify([this.id, this.name, this.data, this.adjacencies]) + ')';
    }
};

/*
     Class: Graph.Edge

     A <Graph> adjacence (or edge) connecting two <Graph.Nodes>.

     Implements:

     <Accessors> methods.

     See also:

     <Graph>, <Graph.Node>

     Properties:

      nodeFrom - A <Graph.Node> connected by this edge.
      nodeTo - Another  <Graph.Node> connected by this edge.
      data - Node data property containing a hash (i.e {}) with custom options.
*/
Graph.Edge = function(nodeFrom, nodeTo, data) {
  this.nodeFrom = nodeFrom;
  this.nodeTo = nodeTo;
  this.data = data || {};
};

Graph.Edge.fromJSON = function(graph, edgeJSON) {
  return new Graph.Edge(graph.get(edgeJSON.nodeFrom),
                        graph.get(edgeJSON.nodeTo),
                        edgeJSON.data);
};

Graph.Edge.prototype.toJSON = function() {
  return {
    nodeFrom: this.nodeFrom.id,
    nodeTo: this.nodeTo.id,
    data: this.data
  };
};

/*
   Object: Graph.Util

   <Graph> traversal and processing utility object.

   Note:

   For your convenience some of these methods have also been appended to <Graph> and <Graph.Node> classes.
*/
Graph.Util = {
    /*
       filter

       For internal use only. Provides a filtering function based on flags.
    */
    filter: function(param) {
        if(!param || !(typeof param == 'string')) return function() { return true; };
        var props = param.split(" ");
        return function(elem) {
            for(var i=0; i<props.length; i++) {
              if(elem[props[i]]) {
                return false;
              }
            }
            return true;
        };
    },
    /*
       Method: getNode

       Returns a <Graph.Node> by *id*.

       Also implemented by:

       <Graph>

       Parameters:

       graph - (object) A <Graph> instance.
       id - (string) A <Graph.Node> id.

       Example:

       (start code js)
         $jit.Graph.Util.getNode(graph, 'nodeid');
         //or...
         graph.getNode('nodeid');
       (end code)
    */
    getNode: function(graph, id) {
        return graph.nodes[id];
    },

    /*
       Method: eachNode

       Iterates over <Graph> nodes performing an *action*.

       Also implemented by:

       <Graph>.

       Parameters:

       graph - (object) A <Graph> instance.
       action - (function) A callback function having a <Graph.Node> as first formal parameter.

       Example:
       (start code js)
         $jit.Graph.Util.eachNode(graph, function(node) {
          alert(node.name);
         });
         //or...
         graph.eachNode(function(node) {
           alert(node.name);
         });
       (end code)
    */
    eachNode: function(graph, action, flags) {
        var filter = this.filter(flags);
        for(var i in graph.nodes) {
          if(filter(graph.nodes[i])) action(graph.nodes[i]);
        }
    },

    /*
      Method: each

      Iterates over <Graph> nodes performing an *action*. It's an alias for <Graph.Util.eachNode>.

      Also implemented by:

      <Graph>.

      Parameters:

      graph - (object) A <Graph> instance.
      action - (function) A callback function having a <Graph.Node> as first formal parameter.

      Example:
      (start code js)
        $jit.Graph.Util.each(graph, function(node) {
         alert(node.name);
        });
        //or...
        graph.each(function(node) {
          alert(node.name);
        });
      (end code)
   */
   each: function(graph, action, flags) {
      this.eachNode(graph, action, flags);
   },

 /*
       Method: eachEdge

       Iterates over <Graph.Node> adjacencies applying the *action* function.

       Also implemented by:

       <Graph.Node>.

       Parameters:

       node - (object) A <Graph.Node>.
       action - (function) A callback function having <Graph.Edge> as first formal parameter.

       Example:
       (start code js)
         $jit.Graph.Util.eachEdge(node, function(adj) {
          alert(adj.nodeTo.name);
         });
         //or...
         node.eachEdge(function(adj) {
           alert(adj.nodeTo.name);
         });
       (end code)
    */
    eachEdge: function(node, action, flags) {
        var adj = node.adjacencies, filter = this.filter(flags);
        for(var id in adj) {
          var a = adj[id];
          if(filter(a)) {
            if(a.nodeFrom != node) {
              var tmp = a.nodeFrom;
              a.nodeFrom = a.nodeTo;
              a.nodeTo = tmp;
            }
            action(a, id);
          }
        }
    },

     /*
       Method: computeLevels

       Performs a BFS traversal setting the correct depth for each node.

       Also implemented by:

       <Graph>.

       Note:

       The depth of each node can then be accessed by
       >node.depth

       Parameters:

       graph - (object) A <Graph>.
       id - (string) A starting node id for the BFS traversal.
       startDepth - (optional|number) A minimum depth value. Default's 0.

    */
    computeLevels: function(graph, id, startDepth, flags) {
        startDepth = startDepth || 0;
        var filter = this.filter(flags);
        this.eachNode(graph, function(elem) {
            elem._flag = false;
            elem.depth = -1;
        }, flags);
        var root = graph.getNode(id);
        root.depth = startDepth;
        var queue = [root];
        while(queue.length != 0) {
            var node = queue.pop();
            node._flag = true;
            this.eachEdge(node, function(adj) {
                var n = adj.nodeTo;
                if(n._flag == false && filter(n) && !adj._hiding) {
                    if(n.depth < 0) n.depth = node.depth + 1 + startDepth;
                    queue.unshift(n);
                }
            }, flags);
        }
    },

    /*
       Method: eachBFS

       Performs a BFS traversal applying *action* to each <Graph.Node>.

       Also implemented by:

       <Graph>.

       Parameters:

       graph - (object) A <Graph>.
       id - (string) A starting node id for the BFS traversal.
       action - (function) A callback function having a <Graph.Node> as first formal parameter.

       Example:
       (start code js)
         $jit.Graph.Util.eachBFS(graph, 'mynodeid', function(node) {
          alert(node.name);
         });
         //or...
         graph.eachBFS('mynodeid', function(node) {
           alert(node.name);
         });
       (end code)
    */
    eachBFS: function(graph, id, action, flags) {
        var filter = this.filter(flags);
        this.clean(graph);
        var queue = [graph.getNode(id)];
        while(queue.length != 0) {
            var node = queue.pop();
            if (!node) return;
            node._flag = true;
            action(node, node.depth);
            this.eachEdge(node, function(adj) {
                var n = adj.nodeTo;
                if(n._flag == false && filter(n) && !adj._hiding) {
                    n._flag = true;
                    queue.unshift(n);
                }
            }, flags);
        }
    },

    /*
       Method: eachLevel

       Iterates over a node's subgraph applying *action* to the nodes of relative depth between *levelBegin* and *levelEnd*.
       In case you need to break the iteration, *action* should return false.

       Also implemented by:

       <Graph.Node>.

       Parameters:

       node - (object) A <Graph.Node>.
       levelBegin - (number) A relative level value.
       levelEnd - (number) A relative level value.
       action - (function) A callback function having a <Graph.Node> as first formal parameter.

    */
    eachLevel: function(node, levelBegin, levelEnd, action, flags) {
        var d = node.depth, filter = this.filter(flags), that = this, shouldContinue = true;
        levelEnd = levelEnd === false? Number.MAX_VALUE -d : levelEnd;
        (function loopLevel(node, levelBegin, levelEnd) {
            if(!shouldContinue) return;
            var d = node.depth, ret;
            if(d >= levelBegin && d <= levelEnd && filter(node)) ret = action(node, d);
            if(typeof ret !== "undefined") shouldContinue = ret;
            if(shouldContinue && d < levelEnd) {
                that.eachEdge(node, function(adj) {
                    var n = adj.nodeTo;
                    if(n.depth > d) loopLevel(n, levelBegin, levelEnd);
                });
            }
        })(node, levelBegin + d, levelEnd + d);
    },

    /*
       Method: eachSubgraph

       Iterates over a node's children recursively.

       Also implemented by:

       <Graph.Node>.

       Parameters:
       node - (object) A <Graph.Node>.
       action - (function) A callback function having a <Graph.Node> as first formal parameter.

       Example:
       (start code js)
         $jit.Graph.Util.eachSubgraph(node, function(node) {
           alert(node.name);
         });
         //or...
         node.eachSubgraph(function(node) {
           alert(node.name);
         });
       (end code)
    */
    eachSubgraph: function(node, action, flags) {
      this.eachLevel(node, 0, false, action, flags);
    },

    /*
       Method: eachSubnode

       Iterates over a node's children (without deeper recursion).

       Also implemented by:

       <Graph.Node>.

       Parameters:
       node - (object) A <Graph.Node>.
       action - (function) A callback function having a <Graph.Node> as first formal parameter.

       Example:
       (start code js)
         $jit.Graph.Util.eachSubnode(node, function(node) {
          alert(node.name);
         });
         //or...
         node.eachSubnode(function(node) {
           alert(node.name);
         });
       (end code)
    */
    eachSubnode: function(node, action, flags) {
        this.eachLevel(node, 1, 1, action, flags);
    },

    /*
       Method: anySubnode

       Returns *true* if any subnode matches the given condition.

       Also implemented by:

       <Graph.Node>.

       Parameters:
       node - (object) A <Graph.Node>.
       cond - (function) A callback function returning a Boolean instance. This function has as first formal parameter a <Graph.Node>.

       Example:
       (start code js)
         $jit.Graph.Util.anySubnode(node, function(node) { return node.name == "mynodename"; });
         //or...
         node.anySubnode(function(node) { return node.name == 'mynodename'; });
       (end code)
    */
    anySubnode: function(node, cond, flags) {
      var flag = false;
      cond = cond || function() { return true; };
      var c = typeof cond == 'string'? function(n) { return n[cond]; } : cond;
      this.eachSubnode(node, function(elem) {
        if(c(elem)) flag = true;
      }, flags);
      return flag;
    },

    /*
       Method: getSubnodes

       Collects all subnodes for a specified node.
       The *level* parameter filters nodes having relative depth of *level* from the root node.

       Also implemented by:

       <Graph.Node>.

       Parameters:
       node - (object) A <Graph.Node>.
       level - (optional|number) Default's *0*. A starting relative depth for collecting nodes.

       Returns:
       An array of nodes.

    */
    getSubnodes: function(node, level, flags) {
        var ans = [], that = this;
        level = level || 0;
        var levelStart, levelEnd;
        if(Array.isArray(level) == 'array') {
            levelStart = level[0];
            levelEnd = level[1];
        } else {
            levelStart = level;
            levelEnd = Number.MAX_VALUE - node.depth;
        }
        this.eachLevel(node, levelStart, levelEnd, function(n) {
            ans.push(n);
        }, flags);
        return ans;
    },


    /*
       Method: getParents

       Returns an Array of <Graph.Nodes> which are parents of the given node.

       Also implemented by:

       <Graph.Node>.

       Parameters:
       node - (object) A <Graph.Node>.

       Returns:
       An Array of <Graph.Nodes>.

       Example:
       (start code js)
         var pars = $jit.Graph.Util.getParents(node);
         //or...
         var pars = node.getParents();

         if(pars.length > 0) {
           //do stuff with parents
         }
       (end code)
    */
    getParents: function(node) {
        var ans = [];
        this.eachEdge(node, function(adj) {
            var n = adj.nodeTo;
            if(n.depth < node.depth) ans.push(n);
        });
        return ans;
    },

    /*
    Method: isDescendantOf

    Returns a boolean indicating if some node is descendant of the node with the given id.

    Also implemented by:

    <Graph.Node>.


    Parameters:
    node - (object) A <Graph.Node>.
    id - (string) A <Graph.Node> id.

    Example:
    (start code js)
      $jit.Graph.Util.isDescendantOf(node, "nodeid"); //true|false
      //or...
      node.isDescendantOf('nodeid');//true|false
    (end code)
 */
 isDescendantOf: function(node, id) {
   if(node.id == id) return true;
   var pars = this.getParents(node), ans = false;
   for ( var i = 0; !ans && i < pars.length; i++) {
     ans = ans || this.isDescendantOf(pars[i], id);
   }
   return ans;
 },

 /*
     Method: clean

     Cleans flags from nodes.

     Also implemented by:

     <Graph>.

     Parameters:
     graph - A <Graph> instance.
  */
  clean: function(graph) { this.eachNode(graph, function(elem) { elem._flag = false; }); }
};

//Append graph methods to <Graph>
['get', 'getNode', 'each', 'eachNode', 'computeLevels', 'eachBFS', 'clean'].forEach(function(m) {
  Graph.prototype[m] = function() {
    return Graph.Util[m].apply(Graph.Util, [this].concat(Array.prototype.slice.call(arguments)));
  };
});

//Append node methods to <Graph.Node>
['eachEdge', 'eachLevel', 'eachSubgraph', 'eachSubnode', 'anySubnode', 'getSubnodes', 'getParents', 'isDescendantOf'].forEach(function(m) {
  Graph.Node.prototype[m] = function() {
    return Graph.Util[m].apply(Graph.Util, [this].concat(Array.prototype.slice.call(arguments)));
  };
});

  this.Graph = Graph;
})();

