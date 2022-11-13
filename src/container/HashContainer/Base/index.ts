import { Container, ContainerIterator, IteratorType } from '@/container/ContainerBase';
import checkObject from '@/utils/checkObject';
import $checkWithinAccessParams from '@/utils/checkParams.macro';
import { throwIteratorAccessError } from '@/utils/throwError';

type HashLinkNode<K, V> = {
  _key: K,
  _value: V,
  _pre: HashLinkNode<K, V>,
  _next: HashLinkNode<K, V>
}

export abstract class HashContainerIterator<K, V> extends ContainerIterator<K | [K, V]> {
  /**
   * @internal
   */
  _node: HashLinkNode<K, V>;
  /**
   * @internal
   */
  _header: HashLinkNode<K, V>;
  pre: () => this;
  next: () => this;
  /**
   * @internal
   */
  constructor(
    node: HashLinkNode<K, V>,
    header: HashLinkNode<K, V>,
    iteratorType?: IteratorType
  ) {
    super(iteratorType);
    this._node = node;
    this._header = header;
    if (this.iteratorType === IteratorType.NORMAL) {
      this.pre = function () {
        if (this._node._pre === this._header) {
          throwIteratorAccessError();
        }
        this._node = this._node._pre;
        return this;
      };
      this.next = function () {
        if (this._node === this._header) {
          throwIteratorAccessError();
        }
        this._node = this._node._next;
        return this;
      };
    } else {
      this.pre = function () {
        if (this._node._next === this._header) {
          throwIteratorAccessError();
        }
        this._node = this._node._next;
        return this;
      };
      this.next = function () {
        if (this._node === this._header) {
          throwIteratorAccessError();
        }
        this._node = this._node._pre;
        return this;
      };
    }
  }
}

export abstract class HashContainer<K, V> extends Container<K | [K, V]> {
  /**
   * @internal
   */
  protected _objMap: HashLinkNode<K, V>[] = [];
  /**
   * @internal
   */
  protected _originMap: Record<string, HashLinkNode<K, V>> = {};
  /**
   * @description unique tag used to tag object.
   */
  readonly HASH_KEY_TAG = Symbol('JS_SDSL_HASH_KEY_TAG');
  /**
   * @internal
   */
  protected _head: HashLinkNode<K, V>;
  /**
   * @internal
   */
  protected _tail: HashLinkNode<K, V>;
  /**
   * @internal
   */
  protected _header: HashLinkNode<K, V>;
  protected constructor() {
    super();
    Object.setPrototypeOf(this._originMap, null);
    this._header = <HashLinkNode<K, V>>{};
    this._header._pre = this._header._next = this._head = this._tail = this._header;
  }
  private _eraseNode(node: HashLinkNode<K, V>) {
    const { _pre, _next } = node;
    _pre._next = _next;
    _next._pre = _pre;
    if (node === this._head) {
      this._head = _next;
    } else if (node === this._tail) {
      this._tail = _pre;
    }
  }
  /**
   * @internal
   */
  protected _set(key: K, value?: V, isObject?: boolean) {
    if (isObject === undefined) isObject = checkObject(key);
    let newTail;
    if (isObject) {
      const index = (<Record<symbol, number>><unknown>key)[this.HASH_KEY_TAG];
      if (index !== undefined) {
        this._objMap[<number>index]._value = <V>value;
        return;
      }
      Object.defineProperty(key, this.HASH_KEY_TAG, {
        value: this._objMap.length,
        configurable: true
      });
      newTail = {
        _key: key,
        _value: <V>value,
        _pre: this._tail,
        _next: this._header
      };
      this._objMap.push(newTail);
    } else {
      const originValue = this._originMap[<string><unknown>key];
      if (originValue) {
        originValue._value = <V>value;
        return;
      }
      newTail = {
        _key: key,
        _value: <V>value,
        _pre: this._tail,
        _next: this._header
      };
      this._originMap[<string><unknown>key] = newTail;
    }
    this._length += 1;
    if (this._length === 1) {
      this._head = newTail;
      this._header._next = newTail;
    } else {
      this._tail._next = newTail;
    }
    this._tail = newTail;
    this._header._pre = newTail;
  }
  clear() {
    const self = this;
    this._objMap.forEach(function (el) {
      delete (<Record<symbol, number>><unknown>el._key)[self.HASH_KEY_TAG];
    });
    this._objMap = [];
    this._originMap = {};
    Object.setPrototypeOf(this._originMap, null);
    this._length = 0;
    this._head = this._tail = this._header._pre = this._header._next = this._header;
  }
  /**
   * @description Remove the element of the specified key.
   * @param key The key you want to remove.
   * @param isObject Tell us if the type of inserted key is `object` to improve efficiency.<br/>
   *                 If a `undefined` value is passed in, the type will be automatically judged.
   */
  eraseElementByKey(key: K, isObject?: boolean) {
    let node;
    if (isObject === undefined) isObject = checkObject(key);
    if (isObject) {
      const index = (<Record<symbol, number>><unknown>key)[this.HASH_KEY_TAG];
      if (index === undefined) return;
      delete (<Record<symbol, number>><unknown>key)[this.HASH_KEY_TAG];
      node = this._objMap[index];
      delete this._objMap[index];
    } else {
      if (this._originMap[<string><unknown>key] === undefined) return;
      node = this._originMap[<string><unknown>key];
      delete this._originMap[<string><unknown>key];
    }
    this._length -= 1;
    this._eraseNode(node);
  }
  eraseElementByIterator(iter: HashContainerIterator<K, V>) {
    const node = iter._node;
    if (node === this._header) {
      throwIteratorAccessError();
    }
    this._eraseNode(node);
    this._length -= 1;
    return iter.next();
  }
  eraseElementByPos(pos: number) {
    $checkWithinAccessParams!(pos, 0, this._length - 1);
    let node = this._head;
    while (pos--) {
      node = node._next;
    }
    this._eraseNode(node);
    this._length -= 1;
  }
  /**
   * @internal
   */
  protected _findElementNode(key: K, isObject?: boolean) {
    if (isObject === undefined) isObject = checkObject(key);
    if (isObject) {
      const index = (<Record<symbol, number>><unknown>key)[this.HASH_KEY_TAG];
      if (index === undefined) return undefined;
      return this._objMap[index];
    } else {
      return this._originMap[<string><unknown>key];
    }
  }
}
