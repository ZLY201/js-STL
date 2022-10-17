import { TreeNode } from './TreeNode';
import type { TreeNodeEnableIndex } from './TreeNode';
import { ContainerIterator, IteratorType } from '@/container/ContainerBase';

abstract class TreeIterator<K, V> extends ContainerIterator<K | [K, V]> {
  /**
   * @internal
   */
  _node: TreeNode<K, V>;
  /**
   * @internal
   */
  protected _header: TreeNode<K, V>;
  pre: () => this;
  next: () => this;
  /**
   * @internal
   */
  constructor(
    _node: TreeNode<K, V>,
    _header: TreeNode<K, V>,
    iteratorType?: IteratorType
  ) {
    super(iteratorType);
    this._node = _node;
    this._header = _header;

    if (this.iteratorType === IteratorType.NORMAL) {
      this.pre = function () {
        if (this._node === this._header._left) {
          throw new RangeError('Tree iterator access denied!');
        }
        this._node = this._node.pre();
        return this;
      };

      this.next = function () {
        if (this._node === this._header) {
          throw new RangeError('Tree iterator access denied!');
        }
        this._node = this._node.next();
        return this;
      };
    } else {
      this.pre = function () {
        if (this._node === this._header._right) {
          throw new RangeError('Tree iterator access denied!');
        }
        this._node = this._node.next();
        return this;
      };

      this.next = function () {
        if (this._node === this._header) {
          throw new RangeError('Tree iterator access denied!');
        }
        this._node = this._node.pre();
        return this;
      };
    }
  }
  /**
   * @description Get the sequential index of the iterator in the tree container.<br/>
   *              <strong>
   *                Note:
   *              </strong>
   *              This function only takes effect when the specified tree container `enableIndex = true`.
   * @example
   * const st = new OrderedSet([1, 2, 3], true);
   * console.log(st.begin().next().index);  // 1
   */
  get index() {
    let _node = this._node as TreeNodeEnableIndex<K, V>;
    const root = this._header._parent as TreeNodeEnableIndex<K, V>;
    if (_node === this._header) {
      if (root) {
        return root._subTreeSize - 1;
      }
      return 0;
    }
    let index = 0;
    if (_node._left) {
      index += _node._left._subTreeSize;
    }
    while (_node !== root) {
      const _parent = _node._parent as TreeNodeEnableIndex<K, V>;
      if (_node === _parent._right) {
        index += 1;
        if (_parent._left) {
          index += _parent._left._subTreeSize;
        }
      }
      _node = _parent;
    }
    return index;
  }
  equals(obj: TreeIterator<K, V>) {
    return this._node === obj._node;
  }
}

export default TreeIterator;
