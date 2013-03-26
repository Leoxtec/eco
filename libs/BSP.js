var BSP = function () {
        /*
        * Private Class: Node
        *
        * A BST node constructor
        *
        * Parameters:
        *        leftChild - a reference to the left child of the node.
        *        key - The key of the node.
        *        value - the value of the node.
        *        rightChild - a reference to the right child of the node.
        *        parent - a reference to the parent of the node.
        *
        * Note: All parameters default to null.
        */
    var Node = function (useX, front, key, value, back, parent) {
            return {
                front: (typeof front === "undefined") ? null : 
                           front,
                key: (typeof key === "undefined") ? null : key,
                value: (typeof value === "undefined") ? null : value,
                back: (typeof back === "undefined") ? null : 
                            back,
                parent: (typeof parent === "undefined") ? null : parent,
				useX: (typeof useX === "undefined") ? null : useX
            };
        },
        
        /*
         * Private Variable: root
         *
         * The root nade of the BST.
         */
        root = new Node(false),
        
        /*
         * Private Method: searchNode
         *
         * Search through a binary tree.
         *
         * Parameters:
         *     node - the node to search on.
         *     key - the key to search for (as an integer).
         *
         * Returns:
         *     the value of the found node,
         *     or null if no node was found.
         *
         */
        searchNode = function (node, key) {
            if (node.key === null) {
                return null; // key not found
            }
            
            var nodeKey = parseInt(node.key, 10);
 
            if (key < nodeKey) {
                return searchNode(node.front, key);
            } else if (key > nodeKey) {
                return searchNode(node.back, key);
            } else { // key is equal to node key
                return node.value;
            }
        },
        
        /*
         * Private Method: insertNode
         *
         * Insert into a binary tree.
         *
         * Parameters:
         *     node - the node to search on.
         *     key - the key to insert (as an integer).
         *     value - the value to associate with the key (any type of 
         *             object).
         *
         * Returns:
         *     true.
         *
         */
        insertNode = function (node, key, value, parent) {
            if (node.key === null) {
                node.front = new Node(!node.useX);
                node.key = key;
                node.value = value;
                node.back = new Node(!node.useX);
                node.parent = parent;
                return true;
            }
            
            var result;
			if(node.useX) {
				result = value[0] - node.value[0];
			}
			else {
				result = value[1] - node.value[1];
			}
 
            if (result > 0) {
                insertNode(node.front, key, value, node);
            } 
			else {
                insertNode(node.back, key, value, node);
            }
        },
		
		findOrder = function(viewpoint, node, order) {
			if (node.key === null) {
                return true;
            }
			
			var result;
			if(node.useX) {
				result = viewpoint[0] - node.value[0];
			}
			else {
				result = viewpoint[1] - node.value[1];
			}
			
			if (result > 0) {
				findOrder(viewpoint, node.back, order);
				order.push(node.key);
                findOrder(viewpoint, node.front, order);
            } 
			else {
				findOrder(viewpoint, node.front, order);
				order.push(node.key);
                findOrder(viewpoint, node.back, order);
            }
		}
		
		findReverseOrder = function(viewpoint, node, order) {
			if (node.key === null) {
                return true;
            }
			
			var result;
			if(node.useX) {
				result = viewpoint[0] - node.value[0];
			}
			else {
				result = viewpoint[1] - node.value[1];
			}
			
			if (result <= 0) {
				findReverseOrder(viewpoint, node.back, order);
				order.push(node.key);
                findReverseOrder(viewpoint, node.front, order);
            } 
			else {
				findReverseOrder(viewpoint, node.front, order);
				order.push(node.key);
                findReverseOrder(viewpoint, node.back, order);
            }
		}
    
        /*
         * Private Method: traverseNode
         *
         * Call a function on each node of a binary tree.
         *
         * Parameters:
         *     node - the node to traverse.
         *     callback - the function to call on each node, this function 
         *                takes a key and a value as parameters.
         *
         * Returns:
         *     true.
         *
         */
        traverseNode = function (node, callback) {
            if (node.key !== null) {
                traverseNode(node.front, callback);
                callback(node.key, node.value);
                traverseNode(node.back, callback);
            }
            
            return true;
        },
        
        /*
         * Private Method: minNode
         *
         * Find the key of the node with the lowest key number.
         *
         * Parameters:
         *     node - the node to traverse.
         *
         * Returns: the key of the node with the lowest key number.
         *
         */
        minNode = function (node) {
            while (node.front.key !== null) {
                node = node.front;
            }
 
            return node.key;
        },
 
        /*
         * Private Method: maxNode
         *
         * Find the key of the node with the highest key number.
         *
         * Parameters:
         *     node - the node to traverse.
         *
         * Returns: the key of the node with the highest key number.
         *
         */
        maxNode = function (node) {
            while (node.back.key !== null) {
                node = node.back;
            }
 
            return node.key;
        },
        
        /*
         * Private Method: successorNode
         *
         * Find the key that successes the given node.
         *
         * Parameters:
		 *		node - the node to find the successor for
         *
         * Returns: the key of the node that successes the given node.
         *
         */
        successorNode = function (node) {
            var parent;
        
            if (node.back.key !== null) {
                return minNode(node.back);
            }
            
            parent = node.parent;
            while (parent.key !== null && node == parent.back) {
                node = parent;
                parent = parent.parent;
            }
            
            return parent.key;
        },
 
        /*
         * Private Method: predecessorNode
         *
         * Find the key that preceeds the given node.
         *
         * Parameters:
		 *		node - the node to find the predecessor for
         *
         * Returns: the key of the node that preceeds the given node.
         *
         */
        predecessorNode = function (node) {
            var parent;
        
            if (node.front.key !== null) {
                return maxNode(node.front);
            }
            
            parent = node.parent;
            while (parent.key !== null && node == parent.front) {
                node = parent;
                parent = parent.parent;
            }
            
            return parent.key;
        };
        
    return {
        /*
         * Method: search
         *
         * Search through a binary tree.
         *
         * Parameters:
         *     key - the key to search for.
         *
         * Returns:
         *     the value of the found node,
         *     or null if no node was found,
         *     or undefined if no key was specified.
         *
         */
        search: function (key) {
            var keyInt = parseInt(key, 10);
 
            if (isNaN(keyInt)) {
                return undefined; // key must be a number
            } else {
                return searchNode(root, keyInt);
            }
        },
 
        /*
         * Method: insert
         *
         * Insert into a binary tree.
         *
         * Parameters:
         *     key - the key to search for.
         *     value - the value to associate with the key (any type of 
         *             object).
         *
         * Returns:
         *     true,
         *     or undefined if no key was specified.
         *
         */
        insert: function (key, value) {
            var keyInt = parseInt(key, 10);
            
            if (isNaN(keyInt)) {
                return undefined; // key must be a number
            } else {
                return insertNode(root, keyInt, value, null);
            }
        },
		
		renderOrder : function(viewpoint) {
			var order = [];
			findOrder(viewpoint, root, order);
			return order;
		},
		
		reverseRenderOrder : function(viewpoint) {
			var order = [];
			findReverseOrder(viewpoint, root, order);
			return order;
		},
        
        /*
         * Method: traverse
         *
         * Call a function on each node of a binary tree.
         *
         * Parameters:
         *     callback - the function to call on each node, this function 
         *                takes a key and a value as parameters. If no 
         *                callback is specified, print is called.
         *
         * Returns:
         *     true.
         *
         */
        traverse: function (callback) {
            if (typeof callback === "undefined") {
                callback = function (key, value) {
                    print(key + ": " + value);
                };
            }
 
            return traverseNode(root, callback);
        },
 
        /*
         * Method: min
         *
         * Find the key of the node with the lowest key number.
         *
         * Parameters: none
         *
         * Returns: the key of the node with the lowest key number.
         *
         */
        min: function () {
            return minNode(root);
        },
 
        /*
         * Method: max
         *
         * Find the key of the node with the highest key number.
         *
         * Parameters: none
         *
         * Returns: the key of the node with the highest key number.
         *
         */
        max: function () {
            return maxNode(root);
        },
		
        /*
         * Method: successor
         *
         * Find the key that successes the root node.
         *
         * Parameters: none
         *
         * Returns: the key of the node that successes the root node.
         *
         */
		successor: function () {
			return successorNode(root);
		},
 
        /*
         * Method: predecessor
         *
         * Find the key that preceeds the root node.
         *
         * Parameters: none
         *
         * Returns: the key of the node that preceeds the root node.
         *
         */
		predecessor: function () {
			return predecessorNode(root);
		}
	};
};
 
/*
 * License:
 *
 * Copyright (c) 2011 Trevor Lalish-Menagh (http://www.trevmex.com/)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */