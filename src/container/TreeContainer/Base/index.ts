import type TreeIterator from './TreeIterator';
import { TreeNode, TreeNodeColor, TreeNodeEnableIndex } from './TreeNode';
import { Container, IteratorType } from '@/container/ContainerBase';
import $checkWithinAccessParams from '@/utils/checkParams.macro';
import { throwIteratorAccessError } from '@/utils/throwError';

abstract class TreeContainer<K, V> extends Container<K | [K, V]> {
  /**
   * @internal
   */
  protected _root: TreeNode<K, V> | undefined = undefined;
  /**
   * @internal
   */
  protected _header: TreeNode<K, V>;
  /**
   * @internal
   */
  protected readonly _cmp: (x: K, y: K) => number;
  /**
   * @internal
   */
  protected readonly _TreeNodeClass: typeof TreeNode | typeof TreeNodeEnableIndex;
  /**
   * @internal
   */
  protected readonly _eraseNode: (curNode: TreeNode<K, V>) => void;
  /**
   * @internal
   */
  protected _set: (key: K, value: V, hint?: TreeIterator<K, V>) => number;
  /**
   * @internal
   */
  protected constructor(
    cmp: (x: K, y: K) => number =
    function (x: K, y: K) {
      if (x < y) return -1;
      if (x > y) return 1;
      return 0;
    },
    enableIndex = false
  ) {
    super();
    this._cmp = cmp;
    if (enableIndex) {
      this._TreeNodeClass = TreeNodeEnableIndex;
      this._set = function (key, value, hint) {
        const curNode = this._preSet(key, value, hint);
        if (curNode) {
          let p = curNode._parent as TreeNodeEnableIndex<K, V>;
          while (p !== this._header) {
            p._subTreeSize += 1;
            p = p._parent as TreeNodeEnableIndex<K, V>;
          }
          const nodeList = this._insertNodeSelfBalance(curNode);
          if (nodeList) {
            const {
              parentNode,
              grandParent,
              curNode
            } = nodeList as unknown as Record<string, TreeNodeEnableIndex<K, V>>;
            parentNode._recount();
            grandParent._recount();
            curNode._recount();
          }
        }
        return this._length;
      };
      this._eraseNode = function (curNode) {
        let p = this._preEraseNode(curNode) as TreeNodeEnableIndex<K, V>;
        while (p !== this._header) {
          p._subTreeSize -= 1;
          p = p._parent as TreeNodeEnableIndex<K, V>;
        }
      };
    } else {
      this._TreeNodeClass = TreeNode;
      this._set = function (key, value, hint) {
        const curNode = this._preSet(key, value, hint);
        if (curNode) this._insertNodeSelfBalance(curNode);
        return this._length;
      };
      this._eraseNode = this._preEraseNode;
    }
    this._header = new this._TreeNodeClass();
  }
  /**
   * @internal
   */
  protected _lowerBound(curNode: TreeNode<K, V> | undefined, key: K) {
    let resNode = this._header;
    while (curNode) {
      const cmpResult = this._cmp(curNode._key!, key);
      if (cmpResult < 0) {
        curNode = curNode._right;
      } else if (cmpResult > 0) {
        resNode = curNode;
        curNode = curNode._left;
      } else return curNode;
    }
    return resNode;
  }
  /**
   * @internal
   */
  protected _upperBound(curNode: TreeNode<K, V> | undefined, key: K) {
    let resNode = this._header;
    while (curNode) {
      const cmpResult = this._cmp(curNode._key!, key);
      if (cmpResult <= 0) {
        curNode = curNode._right;
      } else {
        resNode = curNode;
        curNode = curNode._left;
      }
    }
    return resNode;
  }
  /**
   * @internal
   */
  protected _reverseLowerBound(curNode: TreeNode<K, V> | undefined, key: K) {
    let resNode = this._header;
    while (curNode) {
      const cmpResult = this._cmp(curNode._key!, key);
      if (cmpResult < 0) {
        resNode = curNode;
        curNode = curNode._right;
      } else if (cmpResult > 0) {
        curNode = curNode._left;
      } else return curNode;
    }
    return resNode;
  }
  /**
   * @internal
   */
  protected _reverseUpperBound(curNode: TreeNode<K, V> | undefined, key: K) {
    let resNode = this._header;
    while (curNode) {
      const cmpResult = this._cmp(curNode._key!, key);
      if (cmpResult < 0) {
        resNode = curNode;
        curNode = curNode._right;
      } else {
        curNode = curNode._left;
      }
    }
    return resNode;
  }
  /**
   * @internal
   */
  protected _eraseNodeSelfBalance(curNode: TreeNode<K, V>) {
    while (true) {
      const parentNode = curNode._parent!;
      if (parentNode === this._header) return;
      if (curNode._color === TreeNodeColor.RED) {
        curNode._color = TreeNodeColor.BLACK;
        return;
      }
      if (curNode === parentNode._left) {
        const brother = parentNode._right!;
        if (brother._color === TreeNodeColor.RED) {
          brother._color = TreeNodeColor.BLACK;
          parentNode._color = TreeNodeColor.RED;
          if (parentNode === this._root) {
            this._root = parentNode._rotateLeft();
          } else parentNode._rotateLeft();
        } else {
          if (brother._right && brother._right._color === TreeNodeColor.RED) {
            brother._color = parentNode._color;
            parentNode._color = TreeNodeColor.BLACK;
            brother._right._color = TreeNodeColor.BLACK;
            if (parentNode === this._root) {
              this._root = parentNode._rotateLeft();
            } else parentNode._rotateLeft();
            return;
          } else if (brother._left && brother._left._color === TreeNodeColor.RED) {
            brother._color = TreeNodeColor.RED;
            brother._left._color = TreeNodeColor.BLACK;
            brother._rotateRight();
          } else {
            brother._color = TreeNodeColor.RED;
            curNode = parentNode;
          }
        }
      } else {
        const brother = parentNode._left!;
        if (brother._color === TreeNodeColor.RED) {
          brother._color = TreeNodeColor.BLACK;
          parentNode._color = TreeNodeColor.RED;
          if (parentNode === this._root) {
            this._root = parentNode._rotateRight();
          } else parentNode._rotateRight();
        } else {
          if (brother._left && brother._left._color === TreeNodeColor.RED) {
            brother._color = parentNode._color;
            parentNode._color = TreeNodeColor.BLACK;
            brother._left._color = TreeNodeColor.BLACK;
            if (parentNode === this._root) {
              this._root = parentNode._rotateRight();
            } else parentNode._rotateRight();
            return;
          } else if (brother._right && brother._right._color === TreeNodeColor.RED) {
            brother._color = TreeNodeColor.RED;
            brother._right._color = TreeNodeColor.BLACK;
            brother._rotateLeft();
          } else {
            brother._color = TreeNodeColor.RED;
            curNode = parentNode;
          }
        }
      }
    }
  }
  /**
   * @internal
   */
  protected _preEraseNode(curNode: TreeNode<K, V>) {
    if (this._length === 1) {
      this.clear();
      return this._header;
    }
    let swapNode = curNode;
    while (swapNode._left || swapNode._right) {
      if (swapNode._right) {
        swapNode = swapNode._right;
        while (swapNode._left) swapNode = swapNode._left;
      } else {
        swapNode = swapNode._left!;
      }
      [curNode._key, swapNode._key] = [swapNode._key, curNode._key];
      [curNode._value, swapNode._value] = [swapNode._value, curNode._value];
      curNode = swapNode;
    }
    if (this._header._left === swapNode) {
      this._header._left = swapNode._parent;
    } else if (this._header._right === swapNode) {
      this._header._right = swapNode._parent;
    }
    this._eraseNodeSelfBalance(swapNode);
    const _parent = swapNode._parent!;
    if (swapNode === _parent._left) {
      _parent._left = undefined;
    } else _parent._right = undefined;
    this._length -= 1;
    this._root!._color = TreeNodeColor.BLACK;
    return _parent;
  }
  /**
   * @internal
   */
  protected _inOrderTraversal(
    curNode: TreeNode<K, V> | undefined,
    callback: (curNode: TreeNode<K, V>) => boolean
  ): boolean {
    if (curNode === undefined) return false;
    const ifReturn = this._inOrderTraversal(curNode._left, callback);
    if (ifReturn) return true;
    if (callback(curNode)) return true;
    return this._inOrderTraversal(curNode._right, callback);
  }
  /**
   * @internal
   */
  protected _insertNodeSelfBalance(curNode: TreeNode<K, V>) {
    while (true) {
      const parentNode = curNode._parent!;
      if (parentNode._color === TreeNodeColor.BLACK) return;
      const grandParent = parentNode._parent!;
      if (parentNode === grandParent._left) {
        const uncle = grandParent._right;
        if (uncle && uncle._color === TreeNodeColor.RED) {
          uncle._color = parentNode._color = TreeNodeColor.BLACK;
          if (grandParent === this._root) return;
          grandParent._color = TreeNodeColor.RED;
          curNode = grandParent;
          continue;
        } else if (curNode === parentNode._right) {
          curNode._color = TreeNodeColor.BLACK;
          if (curNode._left) curNode._left._parent = parentNode;
          if (curNode._right) curNode._right._parent = grandParent;
          parentNode._right = curNode._left;
          grandParent._left = curNode._right;
          curNode._left = parentNode;
          curNode._right = grandParent;
          if (grandParent === this._root) {
            this._root = curNode;
            this._header._parent = curNode;
          } else {
            const GP = grandParent._parent!;
            if (GP._left === grandParent) {
              GP._left = curNode;
            } else GP._right = curNode;
          }
          curNode._parent = grandParent._parent;
          parentNode._parent = curNode;
          grandParent._parent = curNode;
          grandParent._color = TreeNodeColor.RED;
          return { parentNode, grandParent, curNode };
        } else {
          parentNode._color = TreeNodeColor.BLACK;
          if (grandParent === this._root) {
            this._root = grandParent._rotateRight();
          } else grandParent._rotateRight();
          grandParent._color = TreeNodeColor.RED;
        }
      } else {
        const uncle = grandParent._left;
        if (uncle && uncle._color === TreeNodeColor.RED) {
          uncle._color = parentNode._color = TreeNodeColor.BLACK;
          if (grandParent === this._root) return;
          grandParent._color = TreeNodeColor.RED;
          curNode = grandParent;
          continue;
        } else if (curNode === parentNode._left) {
          curNode._color = TreeNodeColor.BLACK;
          if (curNode._left) curNode._left._parent = grandParent;
          if (curNode._right) curNode._right._parent = parentNode;
          grandParent._right = curNode._left;
          parentNode._left = curNode._right;
          curNode._left = grandParent;
          curNode._right = parentNode;
          if (grandParent === this._root) {
            this._root = curNode;
            this._header._parent = curNode;
          } else {
            const GP = grandParent._parent!;
            if (GP._left === grandParent) {
              GP._left = curNode;
            } else GP._right = curNode;
          }
          curNode._parent = grandParent._parent;
          parentNode._parent = curNode;
          grandParent._parent = curNode;
          grandParent._color = TreeNodeColor.RED;
          return { parentNode, grandParent, curNode };
        } else {
          parentNode._color = TreeNodeColor.BLACK;
          if (grandParent === this._root) {
            this._root = grandParent._rotateLeft();
          } else grandParent._rotateLeft();
          grandParent._color = TreeNodeColor.RED;
        }
      }
      return;
    }
  }
  /**
   * @internal
   */
  protected _preSet(key: K, value?: V, hint?: TreeIterator<K, V>) {
    if (this._root === undefined) {
      this._length += 1;
      this._root = new this._TreeNodeClass(key, value);
      this._root._color = TreeNodeColor.BLACK;
      this._root._parent = this._header;
      this._header._parent = this._root;
      this._header._left = this._root;
      this._header._right = this._root;
      return;
    }
    let curNode;
    const minNode = this._header._left!;
    const compareToMin = this._cmp(minNode._key!, key);
    if (compareToMin === 0) {
      minNode._value = value;
      return;
    } else if (compareToMin > 0) {
      minNode._left = new this._TreeNodeClass(key, value);
      minNode._left._parent = minNode;
      curNode = minNode._left;
      this._header._left = curNode;
    } else {
      const maxNode = this._header._right!;
      const compareToMax = this._cmp(maxNode._key!, key);
      if (compareToMax === 0) {
        maxNode._value = value;
        return;
      } else if (compareToMax < 0) {
        maxNode._right = new this._TreeNodeClass(key, value);
        maxNode._right._parent = maxNode;
        curNode = maxNode._right;
        this._header._right = curNode;
      } else {
        if (hint !== undefined) {
          const iterNode = hint._node;
          if (iterNode !== this._header) {
            const iterCmpRes = this._cmp(iterNode._key!, key);
            if (iterCmpRes === 0) {
              iterNode._value = value;
              return;
            } else /* istanbul ignore else */ if (iterCmpRes > 0) {
              const preNode = iterNode._pre();
              const preCmpRes = this._cmp(preNode._key!, key);
              if (preCmpRes === 0) {
                preNode._value = value;
                return;
              } else if (preCmpRes < 0) {
                curNode = new this._TreeNodeClass(key, value);
                if (preNode._right === undefined) {
                  preNode._right = curNode;
                  curNode._parent = preNode;
                } else {
                  iterNode._left = curNode;
                  curNode._parent = iterNode;
                }
              }
            }
          }
        }
        if (curNode === undefined) {
          curNode = this._root;
          while (true) {
            const cmpResult = this._cmp(curNode._key!, key);
            if (cmpResult > 0) {
              if (curNode._left === undefined) {
                curNode._left = new this._TreeNodeClass(key, value);
                curNode._left._parent = curNode;
                curNode = curNode._left;
                break;
              }
              curNode = curNode._left;
            } else if (cmpResult < 0) {
              if (curNode._right === undefined) {
                curNode._right = new this._TreeNodeClass(key, value);
                curNode._right._parent = curNode;
                curNode = curNode._right;
                break;
              }
              curNode = curNode._right;
            } else {
              curNode._value = value;
              return;
            }
          }
        }
      }
    }
    this._length += 1;
    return curNode;
  }
  /**
   * @internal
   */
  protected _findElementNode(curNode: TreeNode<K, V> | undefined, key: K) {
    while (curNode) {
      const cmpResult = this._cmp(curNode._key!, key);
      if (cmpResult < 0) {
        curNode = curNode._right;
      } else if (cmpResult > 0) {
        curNode = curNode._left;
      } else return curNode;
    }
    return curNode || this._header;
  }
  clear() {
    this._length = 0;
    this._root = undefined;
    this._header._parent = undefined;
    this._header._left = this._header._right = undefined;
  }
  /**
   * @description Update node's key by iterator.
   * @param iter - The iterator you want to change.
   * @param key - The key you want to update.
   * @returns Whether the modification is successful.
   * @example
   * const st = new orderedSet([1, 2, 5]);
   * const iter = st.find(2);
   * st.updateKeyByIterator(iter, 3); // then st will become [1, 3, 5]
   */
  updateKeyByIterator(iter: TreeIterator<K, V>, key: K): boolean {
    const node = iter._node;
    if (node === this._header) {
      throwIteratorAccessError();
    }
    if (this._length === 1) {
      node._key = key;
      return true;
    }
    if (node === this._header._left) {
      if (this._cmp(node._next()._key!, key) > 0) {
        node._key = key;
        return true;
      }
      return false;
    }
    if (node === this._header._right) {
      if (this._cmp(node._pre()._key!, key) < 0) {
        node._key = key;
        return true;
      }
      return false;
    }
    const preKey = node._pre()._key!;
    if (this._cmp(preKey, key) >= 0) return false;
    const nextKey = node._next()._key!;
    if (this._cmp(nextKey, key) <= 0) return false;
    node._key = key;
    return true;
  }
  eraseElementByPos(pos: number) {
    $checkWithinAccessParams!(pos, 0, this._length - 1);
    let index = 0;
    const self = this;
    this._inOrderTraversal(
      this._root,
      function (curNode) {
        if (pos === index) {
          self._eraseNode(curNode);
          return true;
        }
        index += 1;
        return false;
      });
    return this._length;
  }
  /**
   * @description Remove the element of the specified key.
   * @param key - The key you want to remove.
   * @returns Whether erase successfully.
   */
  eraseElementByKey(key: K) {
    if (this._length === 0) return false;
    const curNode = this._findElementNode(this._root, key);
    if (curNode === this._header) return false;
    this._eraseNode(curNode);
    return true;
  }
  eraseElementByIterator(iter: TreeIterator<K, V>) {
    const node = iter._node;
    if (node === this._header) {
      throwIteratorAccessError();
    }
    const hasNoRight = node._right === undefined;
    const isNormal = iter.iteratorType === IteratorType.NORMAL;
    // For the normal iterator, the `next` node will be swapped to `this` node when has right.
    if (isNormal) {
      // So we should move it to next when it's right is null.
      if (hasNoRight) iter.next();
    } else {
      // For the reverse iterator, only when it doesn't have right and has left the `next` node will be swapped.
      // So when it has right, or it is a leaf node we should move it to `next`.
      if (!hasNoRight || node._left === undefined) iter.next();
    }
    this._eraseNode(node);
    return iter;
  }
  forEach(callback: (element: K | [K, V], index: number, tree: TreeContainer<K, V>) => void) {
    let index = 0;
    for (const element of this) callback(element, index++, this);
  }
  getElementByPos(pos: number) {
    $checkWithinAccessParams!(pos, 0, this._length - 1);
    let res;
    let index = 0;
    for (const element of this) {
      if (index === pos) {
        res = element;
        break;
      }
      index += 1;
    }
    return <K | [K, V]>res;
  }
  /**
   * @description Get the height of the tree.
   * @returns Number about the height of the RB-tree.
   */
  getHeight() {
    if (this._length === 0) return 0;
    const traversal =
      function (curNode: TreeNode<K, V> | undefined): number {
        if (!curNode) return 0;
        return Math.max(traversal(curNode._left), traversal(curNode._right)) + 1;
      };
    return traversal(this._root);
  }
  /**
   * @param key - The given key you want to compare.
   * @returns An iterator to the first element less than the given key.
   */
  abstract reverseUpperBound(key: K): TreeIterator<K, V>;
  /**
   * @description Union the other tree to self.
   * @param other - The other tree container you want to merge.
   * @returns The size of the tree after union.
   */
  abstract union(other: TreeContainer<K, V>): number;
  /**
   * @param key - The given key you want to compare.
   * @returns An iterator to the first element not greater than the given key.
   */
  abstract reverseLowerBound(key: K): TreeIterator<K, V>;
  /**
   * @param key - The given key you want to compare.
   * @returns An iterator to the first element not less than the given key.
   */
  abstract lowerBound(key: K): TreeIterator<K, V>;
  /**
   * @param key - The given key you want to compare.
   * @returns An iterator to the first element greater than the given key.
   */
  abstract upperBound(key: K): TreeIterator<K, V>;
}

export default TreeContainer;
